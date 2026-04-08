import { createBot, Bot } from 'mineflayer';
import { consola } from 'consola';
import env from '@/config/env';
import { BOT_STATES, BotState, HYPIXEL_HOST, HYPIXEL_PORT, MINECRAFT_VERSION } from '@/config/constants';
import messageQueue from '@/queue/message-queue';

export type { BotState };

export class MinecraftBot {
    public bot!: Bot;
    public state: BotState = BOT_STATES.DISCONNECTED;
    public limboAttempts = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private messageHandler?: (raw: string) => Promise<void>;

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
    }

    public disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        try { this.bot.end(); } catch { /* ignore */ }
        this.state = BOT_STATES.DISCONNECTED;
    }

    public scheduleReconnect(): void {
        if (this.reconnectTimer) return;

        const delay = env.MINECRAFT_RECONNECT_DELAY * 1000;
        consola.warn(`Reconnecting in ${env.MINECRAFT_RECONNECT_DELAY}s...`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
            if (this.messageHandler) {
                this.registerMessageHandler(this.messageHandler);
            }
        }, delay);
    }

    public registerMessageHandler(handler: (raw: string) => Promise<void>): void {
        this.messageHandler = handler;
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

    /** Send to Limbo */
    public sendToLimbo(): void {
        this.limboAttempts++;
        if (this.limboAttempts >= 5) {
            consola.fatal('Max limbo attempts reached. Exiting.');
            process.exit(1);
        }
        consola.info(`Sending bot to Limbo (attempt ${this.limboAttempts})...`);
        this.bot.chat('/limbo');
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
}
