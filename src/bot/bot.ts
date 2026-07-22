import { createBot, Bot } from 'mineflayer';
import { consola } from 'consola';
import env from '@/config/env';
import {
    BOT_STATES,
    BotState,
    HYPIXEL_HOST,
    HYPIXEL_PORT,
    MINECRAFT_VERSION,
} from '@/config/constants';
import messageQueue from '@/queue/message-queue';

export type { BotState };

export class MinecraftBot {
    public bot!: Bot;
    public state: BotState = BOT_STATES.DISCONNECTED;
    public limboAttempts = 0;
    /** Sessions that exhausted /limbo retries without confirmation (for process.exit last resort). */
    public limboExhaustedSessions = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private limboRetryTimer: NodeJS.Timeout | null = null;
    private lastLimboCommandAt = 0;
    private messageHandler?: (raw: string) => Promise<void>;
    /** Called after each new Mineflayer client is created (login/end/kick wiring). */
    private lifecycleHandler?: () => void;
    /**
     * Invoked when /limbo retries are exhausted for the current session.
     * Bridge uses this to relogin; process.exit remains the last resort after N sessions.
     */
    private limboExhaustedHandler?: (reason: string) => void;
    /** True during intentional shutdown (/terminate, !reboot, SIGINT) — blocks reconnect. */
    private shuttingDown = false;
    /**
     * When true, the next `end` event must not auto-schedule a reconnect
     * (used by forceRelogin which schedules its own reconnect).
     */
    private suppressAutoReconnect = false;

    constructor() {
        this.connect();
    }

    public connect(): void {
        this.state = BOT_STATES.CONNECTING;
        consola.info('Connecting to Hypixel...');

        this.bot = createBot({
            username: env.MINECRAFT_EMAIL,
            host: HYPIXEL_HOST,
            port: HYPIXEL_PORT,
            version: MINECRAFT_VERSION,
            auth: 'microsoft',
        });

        this.bot.setMaxListeners(50);

        // Wire message queue to bot send function
        messageQueue.setSendFn((msg) => this.bot.chat(msg));

        // Re-attach Bridge lifecycle listeners to the new client
        this.lifecycleHandler?.();

        // Re-attach message handler if one was registered
        if (this.messageHandler) {
            this.attachMessageListener(this.messageHandler);
        }
    }

    public disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.clearLimboRetry();
        try {
            this.bot.end();
        } catch {
            /* ignore */
        }
        this.state = BOT_STATES.DISCONNECTED;
    }

    /** Block further reconnects (intentional process shutdown). */
    public markShuttingDown(): void {
        this.shuttingDown = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.clearLimboRetry();
    }

    /** Wire limbo-exhaustion recovery (typically Bridge.requestRelogin). */
    public onLimboExhausted(handler: (reason: string) => void): void {
        this.limboExhaustedHandler = handler;
    }

    public get isShuttingDown(): boolean {
        return this.shuttingDown;
    }

    public get isReconnectPending(): boolean {
        return this.reconnectTimer !== null;
    }

    /**
     * Register a callback that wires login/end/kick/error onto the current
     * Mineflayer client. Invoked immediately and again after every reconnect.
     */
    public onLifecycle(handler: () => void): void {
        this.lifecycleHandler = handler;
        handler();
    }

    public scheduleReconnect(): void {
        if (this.shuttingDown || this.suppressAutoReconnect) return;
        this.queueReconnect();
    }

    /**
     * Controlled relogin: cleanly end the current session, then schedule a
     * reconnect. Safe to call when the bot is stuck (e.g. connecting forever)
     * or when health monitoring requests a recovery.
     */
    public forceRelogin(reason = 'manual'): void {
        if (this.shuttingDown) {
            consola.info(`[Relogin] Skipped (${reason}) — shutting down`);
            return;
        }

        consola.warn(`[Relogin] Starting controlled relogin (${reason})...`);

        // Suppress auto-reconnect from the disconnect `end` event while we
        // queue our own reconnect, then clear the flag.
        this.suppressAutoReconnect = true;
        try {
            this.disconnect();
            this.queueReconnect();
        } finally {
            this.suppressAutoReconnect = false;
        }
    }

    private queueReconnect(): void {
        if (this.shuttingDown) return;
        if (this.reconnectTimer) return;

        const delay = env.MINECRAFT_RECONNECT_DELAY * 1000;
        consola.warn(`Reconnecting in ${env.MINECRAFT_RECONNECT_DELAY}s...`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.shuttingDown) return;
            this.connect();
        }, delay);
    }

    public registerMessageHandler(handler: (raw: string) => Promise<void>): void {
        this.messageHandler = handler;
        this.attachMessageListener(handler);
    }

    private attachMessageListener(handler: (raw: string) => Promise<void>): void {
        this.bot.on('message', async (jsonMsg) => {
            const str = typeof jsonMsg === 'string' ? jsonMsg : jsonMsg.toString();
            await handler(str);
        });
    }

    /** Send to guild or officer chat via queue */
    public chat(mode: 'gc' | 'oc', message: string): void {
        const prefix = mode === 'gc' ? '/gc' : '/oc';
        messageQueue.enqueue(`${prefix} ${message}`);
    }

    /** Send raw command, optionally capture response */
    public execute(message: string): void {
        messageQueue.enqueue(message);
    }

    /**
     * Keep trying `/limbo` until state is confirmed limbo (or attempts exhausted).
     * Safe to call repeatedly — respects cooldown and skips when already in limbo.
     */
    public ensureInLimbo(reason = 'ensure'): void {
        if (this.shuttingDown) return;
        if (this.state === BOT_STATES.LIMBO) {
            this.clearLimboRetry();
            return;
        }
        if (this.state !== BOT_STATES.CONNECTED) return;

        const cooldownMs = env.MINECRAFT_LIMBO_RETRY_COOLDOWN_SECONDS * 1000;
        const sinceLast = Date.now() - this.lastLimboCommandAt;
        if (this.lastLimboCommandAt > 0 && sinceLast < cooldownMs) {
            this.scheduleLimboRetry(cooldownMs - sinceLast, reason);
            return;
        }

        this.sendToLimbo(reason);
    }

    /** Confirmed Hypixel limbo spawn — stop retries and reset attempt counters. */
    public confirmLimbo(): void {
        this.state = BOT_STATES.LIMBO;
        this.limboAttempts = 0;
        this.limboExhaustedSessions = 0;
        this.clearLimboRetry();
        consola.success('Bot is in Limbo');
    }

    /**
     * Left limbo unintentionally (lobby / game). Mark connected and resume limbo recovery.
     */
    public leftLimbo(reason = 'lobby'): void {
        if (this.state === BOT_STATES.LIMBO || this.state === BOT_STATES.CONNECTED) {
            this.state = BOT_STATES.CONNECTED;
        }
        // Fresh attempt budget for this recovery cycle
        this.limboAttempts = 0;
        consola.warn(`[Limbo] Left limbo (${reason}) — recovering...`);
        // Replace any pending retry so recovery starts promptly after teleport
        this.clearLimboRetry();
        this.scheduleLimboRetry(1500, reason);
    }

    /** Send `/limbo` once (with attempt accounting). Prefer ensureInLimbo for keep-alive. */
    public sendToLimbo(reason = 'manual'): void {
        if (this.shuttingDown) return;
        if (this.state === BOT_STATES.LIMBO) {
            this.clearLimboRetry();
            return;
        }
        if (this.state !== BOT_STATES.CONNECTED) return;

        const maxAttempts = env.MINECRAFT_LIMBO_MAX_ATTEMPTS;
        this.limboAttempts++;

        if (this.limboAttempts > maxAttempts) {
            this.handleLimboExhausted(reason);
            return;
        }

        this.lastLimboCommandAt = Date.now();
        consola.info(
            `Sending bot to Limbo (attempt ${this.limboAttempts}/${maxAttempts}, reason=${reason})...`
        );
        try {
            this.bot.chat('/limbo');
        } catch (err) {
            consola.warn('[Limbo] Failed to send /limbo:', err);
        }

        // Re-check after cooldown if still not confirmed in limbo
        this.scheduleLimboRetry(env.MINECRAFT_LIMBO_RETRY_COOLDOWN_SECONDS * 1000, reason);
    }

    private handleLimboExhausted(reason: string): void {
        this.clearLimboRetry();
        this.limboExhaustedSessions++;
        const exitAfter = env.MINECRAFT_LIMBO_EXIT_AFTER_SESSIONS;

        consola.error(
            `[Limbo] Max attempts (${env.MINECRAFT_LIMBO_MAX_ATTEMPTS}) reached ` +
                `(session ${this.limboExhaustedSessions}/${exitAfter}, reason=${reason})`
        );

        if (this.limboExhaustedSessions >= exitAfter) {
            consola.fatal(
                `Max limbo attempts reached across ${exitAfter} session(s). Exiting.`
            );
            process.exit(1);
        }

        // Reset per-session counter so a relogin can try again
        this.limboAttempts = 0;

        if (this.limboExhaustedHandler) {
            this.limboExhaustedHandler(`limbo-exhausted:${reason}`);
            return;
        }

        // No recovery handler wired — legacy last resort
        consola.fatal('Max limbo attempts reached. Exiting.');
        process.exit(1);
    }

    private scheduleLimboRetry(delayMs: number, reason: string): void {
        if (this.shuttingDown || this.state === BOT_STATES.LIMBO) return;
        if (this.limboRetryTimer) return;

        this.limboRetryTimer = setTimeout(() => {
            this.limboRetryTimer = null;
            this.ensureInLimbo(reason);
        }, Math.max(0, delayMs));
    }

    private clearLimboRetry(): void {
        if (this.limboRetryTimer) {
            clearTimeout(this.limboRetryTimer);
            this.limboRetryTimer = null;
        }
    }

    /** Execute a command and wait for a response or error */
    public executeAndCapture(command: string): Promise<string | undefined> {
        return new Promise((resolve, reject) => {
            const listener = (jsonMsg: unknown) => {
                const str = typeof jsonMsg === 'string' ? jsonMsg : String(jsonMsg);
                if (/You cannot say the same message twice!/.test(str)) {
                    cleanup();
                    reject(str);
                }
                if (/You cannot message this player/i.test(str)) {
                    cleanup();
                    reject(str.replace(/§./g, ''));
                }
                if (/§c/.test(str)) {
                    cleanup();
                    reject(str.replace(/§./g, ''));
                }
            };

            const cleanup = () => {
                this.bot.removeListener('message', listener);
                clearTimeout(timer);
            };

            const timer = setTimeout(() => {
                cleanup();
                resolve(undefined);
            }, 500);

            this.bot.on('message', listener);
            this.bot.chat(command);
        });
    }

    /**
     * Execute a command and collect multi-line output.
     * Collects all messages received within the timeout window.
     * Optionally stops early when `endPattern` matches (after `endCount` hits).
     */
    public collectLines(
        command: string,
        opts?: {
            timeout?: number;
            endPattern?: RegExp;
            endCount?: number;
        }
    ): Promise<string[]> {
        const timeout = opts?.timeout ?? 3000;
        const endPattern = opts?.endPattern;
        const endTarget = opts?.endCount ?? 2;

        return new Promise((resolve) => {
            const lines: string[] = [];
            let endSeen = 0;

            const listener = (jsonMsg: unknown) => {
                const raw = typeof jsonMsg === 'string' ? jsonMsg : String(jsonMsg);
                // Strip Minecraft color/formatting codes (§X)
                const str = raw.replace(/§./g, '');
                lines.push(str);

                if (endPattern && endPattern.test(str)) {
                    endSeen++;
                    if (endSeen >= endTarget) {
                        cleanup();
                        resolve(lines);
                    }
                }
            };

            const cleanup = () => {
                this.bot.removeListener('message', listener);
                clearTimeout(timer);
            };

            const timer = setTimeout(() => {
                cleanup();
                resolve(lines);
            }, timeout);

            this.bot.on('message', listener);
            this.bot.chat(command);
        });
    }
}
