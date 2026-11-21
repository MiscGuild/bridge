import { createBot, Bot, BotOptions } from 'mineflayer';
import { consola } from 'consola';
import env from '@/config/env';
import {
    BOT_STATES,
    BotState,
    HYPIXEL_HOST,
    HYPIXEL_PORT,
    MC_LOGIN_TIMEOUT_MS,
    MC_RECONNECT_MAX_DELAY_MS,
    MINECRAFT_VERSION,
} from '@/config/constants';
import messageQueue from '@/queue/message-queue';

export type { BotState };

/** The device code Microsoft hands out when the account has to sign in again. */
export type SignInCode = Parameters<NonNullable<BotOptions['onMsaCode']>>[0];

function errorText(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

/** Kick reasons arrive as chat-component JSON; flatten them to plain text. */
function chatText(reason: string): string {
    const flatten = (node: unknown): string => {
        if (typeof node === 'string') return node;
        if (!node || typeof node !== 'object') return '';
        const { text, extra } = node as { text?: unknown; extra?: unknown };
        return (
            (typeof text === 'string' ? text : '') +
            (Array.isArray(extra) ? extra.map(flatten).join('') : '')
        );
    };
    try {
        return flatten(JSON.parse(reason)).replace(/§./g, '').trim() || reason;
    } catch {
        return reason;
    }
}

export class MinecraftBot {
    public bot!: Bot;
    public state: BotState = BOT_STATES.DISCONNECTED;
    public limboAttempts = 0;
    /** Sessions that exhausted /limbo retries without confirmation (for process.exit last resort). */
    public limboExhaustedSessions = 0;
    /** Why the last connect attempt failed or the session dropped. Cleared on login. */
    public lastIssue: string | null = null;
    private reconnectTimer: NodeJS.Timeout | null = null;
    /** Deadline for the connect attempt in flight, so a stuck sign-in can't hang it forever. */
    private loginTimer: NodeJS.Timeout | null = null;
    /** Reconnects since the bot last reached limbo; each one doubles the delay. */
    private reconnectStreak = 0;
    /** Clients we gave up on. Their listeners stay attached, so their events must be ignored. */
    private abandonedClients = new WeakSet<Bot>();
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
    /** Alerts staff when Microsoft wants the account to sign in again. */
    private signInHandler?: (code: SignInCode) => void;
    /** The sign-in alert goes out once per outage, not once per code. */
    private signInAlerted = false;
    /** True during intentional shutdown (/terminate, !reboot, SIGINT) — blocks reconnect. */
    private shuttingDown = false;

    constructor() {
        messageQueue.setSendFn((msg) => this.send(msg));
        this.connect();
    }

    public connect(): void {
        // Exactly one live client: close whatever the last session left behind
        if (this.bot) this.abandonClient(this.bot);

        this.state = BOT_STATES.CONNECTING;
        consola.info('Connecting to Hypixel...');

        const client: Bot = createBot({
            username: env.MINECRAFT_EMAIL,
            host: HYPIXEL_HOST,
            port: HYPIXEL_PORT,
            version: MINECRAFT_VERSION,
            auth: 'microsoft',
            onMsaCode: (code) => this.handleSignInCode(client, code),
        });
        this.bot = client;
        client.setMaxListeners(50);

        this.trackConnection(client);

        // Re-attach Bridge lifecycle listeners to the new client
        this.lifecycleHandler?.();

        // Re-attach message handler if one was registered
        if (this.messageHandler) {
            this.attachMessageListener(this.messageHandler);
        }
    }

    /**
     * Moves `state` through connecting → connected / disconnected for one client and
     * reconnects when it drops. A failed Microsoft sign-in only emits `error`: no socket
     * was opened, so no `end` follows. That's why a connect attempt also fails on an
     * error before login, or when it hasn't logged in by the deadline.
     */
    private trackConnection(client: Bot): void {
        this.armLoginTimer(
            client,
            MC_LOGIN_TIMEOUT_MS,
            `no login within ${MC_LOGIN_TIMEOUT_MS / 1000}s`
        );

        client.once('login', () => {
            if (!this.isCurrentClient(client)) return;
            this.clearLoginTimer();
            this.state = BOT_STATES.CONNECTED;
            this.limboAttempts = 0;
            this.lastIssue = null;
            this.signInAlerted = false;
        });

        client.on('error', (err) => {
            if (this.isCurrentClient(client) && this.state === BOT_STATES.CONNECTING) {
                this.failConnect(client, errorText(err));
            }
        });

        let kicked = false;
        client.on('kicked', (reason) => {
            if (!this.isCurrentClient(client)) return;
            kicked = true;
            this.lastIssue = `Kicked: ${chatText(reason)}`;
            this.clearLoginTimer();
            this.state = BOT_STATES.DISCONNECTED;
            this.scheduleReconnect();
        });

        client.on('end', (reason) => {
            if (!this.isCurrentClient(client)) return;
            if (!kicked) this.lastIssue = `Disconnected: ${reason}`;
            this.clearLoginTimer();
            this.state = BOT_STATES.DISCONNECTED;
            this.scheduleReconnect();
        });
    }

    /** False once a client has been replaced or abandoned. Ignore its events then. */
    public isCurrentClient(client: Bot): boolean {
        return client === this.bot && !this.abandonedClients.has(client);
    }

    /** Give up on a connect attempt that can't finish, then retry with backoff. */
    private failConnect(client: Bot, reason: string): void {
        if (!this.isCurrentClient(client)) return;
        consola.warn(`[Connect] Attempt failed: ${reason}`);
        this.lastIssue = `Connect failed: ${reason}`;
        this.abandonClient(client);
        this.state = BOT_STATES.DISCONNECTED;
        this.scheduleReconnect();
    }

    /** Close a client we're done with; its later events (even `end`) are ignored. */
    private abandonClient(client: Bot): void {
        if (client === this.bot) this.clearLoginTimer();
        this.abandonedClients.add(client);
        try {
            client.end();
        } catch {
            /* ignore */
        }
    }

    /**
     * prismarine-auth falls back to a device code when a token refresh fails, then waits
     * for someone to enter it. Keep this attempt open until the code expires so the code
     * in the console stays valid, instead of retrying with a fresh one every minute.
     */
    private handleSignInCode(client: Bot, code: SignInCode): void {
        if (!this.isCurrentClient(client)) return;
        const instructions =
            code.message || `Open ${code.verification_uri} and enter the code ${code.user_code}`;
        consola.warn(
            `[Auth] Microsoft wants the bot to sign in again (use the account in MINECRAFT_EMAIL). ${instructions}`
        );
        this.lastIssue =
            'Waiting for Microsoft sign-in (the link and code are in the server console)';
        this.armLoginTimer(client, (code.expires_in + 30) * 1000, 'Microsoft sign-in code expired');
        if (this.signInHandler && !this.signInAlerted) {
            this.signInAlerted = true;
            this.signInHandler(code);
        }
    }

    private armLoginTimer(client: Bot, ms: number, reason: string): void {
        this.clearLoginTimer();
        this.loginTimer = setTimeout(() => {
            this.loginTimer = null;
            this.failConnect(client, reason);
        }, ms);
    }

    private clearLoginTimer(): void {
        if (this.loginTimer) {
            clearTimeout(this.loginTimer);
            this.loginTimer = null;
        }
    }

    public disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.clearLimboRetry();
        this.abandonClient(this.bot);
        this.state = BOT_STATES.DISCONNECTED;
    }

    /** Block further reconnects (intentional process shutdown). */
    public markShuttingDown(): void {
        this.shuttingDown = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.clearLoginTimer();
        this.clearLimboRetry();
    }

    /** Wire limbo-exhaustion recovery (typically Bridge.requestRelogin). */
    public onLimboExhausted(handler: (reason: string) => void): void {
        this.limboExhaustedHandler = handler;
    }

    /** Wire the alert for when Microsoft wants the account to sign in again. */
    public onSignInRequired(handler: (code: SignInCode) => void): void {
        this.signInHandler = handler;
    }

    public get isShuttingDown(): boolean {
        return this.shuttingDown;
    }

    public get isReconnectPending(): boolean {
        return this.reconnectTimer !== null;
    }

    /** Already recovering on its own: a reconnect is queued or a connect attempt is running. */
    public get isRecovering(): boolean {
        return this.reconnectTimer !== null || this.loginTimer !== null;
    }

    /** Logged in, so chat can be sent. */
    public get isOnline(): boolean {
        return this.state === BOT_STATES.CONNECTED || this.state === BOT_STATES.LIMBO;
    }

    /**
     * Register a callback that wires login/end/kick/error onto the current
     * Mineflayer client. Invoked immediately and again after every reconnect.
     */
    public onLifecycle(handler: () => void): void {
        this.lifecycleHandler = handler;
        handler();
    }

    /**
     * Reconnect after a drop or a failed attempt. The delay doubles each time until the
     * bot reaches limbo again, so an outage doesn't mean a login attempt every 10s.
     */
    private scheduleReconnect(): void {
        const baseMs = env.MINECRAFT_RECONNECT_DELAY * 1000;
        const backoffMs = Math.min(baseMs * 2 ** this.reconnectStreak, MC_RECONNECT_MAX_DELAY_MS);
        if (this.queueReconnect(Math.max(baseMs, backoffMs))) this.reconnectStreak++;
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

        // disconnect() abandons the client, so its `end` can't queue a second reconnect
        this.disconnect();
        this.queueReconnect(env.MINECRAFT_RECONNECT_DELAY * 1000);
    }

    /** Returns false when nothing was queued (shutting down, or a reconnect is already pending). */
    private queueReconnect(delayMs: number): boolean {
        if (this.shuttingDown || this.reconnectTimer) return false;

        consola.warn(`Reconnecting in ${Math.round(delayMs / 1000)}s...`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.shuttingDown) return;
            this.connect();
        }, delayMs);
        return true;
    }

    /** The message queue's send function. Offline, Mineflayer would throw, so drop instead. */
    private send(message: string): void {
        if (!this.isOnline) {
            consola.warn(`[Chat] Not sent, Minecraft is ${this.state}: ${message}`);
            return;
        }
        this.bot.chat(message);
    }

    private offlineError(): string {
        return `The bot isn't connected to Minecraft right now (${this.state}).`;
    }

    public registerMessageHandler(handler: (raw: string) => Promise<void>): void {
        this.messageHandler = handler;
        this.attachMessageListener(handler);
    }

    private attachMessageListener(handler: (raw: string) => Promise<void>): void {
        const client = this.bot;
        client.on('message', async (jsonMsg) => {
            if (!this.isCurrentClient(client)) return;
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
        this.reconnectStreak = 0;
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
        if (!this.isOnline) return Promise.reject(this.offlineError());
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
        if (!this.isOnline) return Promise.reject(this.offlineError());
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
