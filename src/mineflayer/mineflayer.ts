import env from '@util/env';
import { BotEvents, createBot } from 'mineflayer';
import winston from 'winston';
import path from 'path';
import loadEvents from '@util/load-events';
import Bridge from '../bridge';

const LIMBO_SPAM_THRESHOLD = 3;

export default class Mineflayer {
    private static createBot = () =>
        createBot({
            username: env.MINECRAFT_EMAIL,
            password: env.MINECRAFT_PASSWORD,
            host: 'mc.hypixel.net',
            auth: 'microsoft',
            // 1.8.9 for hypixel LTS
            version: '1.8.9',
            defaultChatPatterns: false,
        });

    public reconnecting = false;
    public limboAttempts = 0;
    private bot = Mineflayer.createBot();

    public reconnectOrExit(bridge: Bridge) {
        if (this.reconnecting) {
            winston.error('Exiting due to failed reconnect attempt');
            process.exit(1);
        }

        this.reconnecting = true;
        this.bot = Mineflayer.createBot();
        this.loadEvents(bridge);
    }

    public sendToLimbo() {
        if (this.limboAttempts < LIMBO_SPAM_THRESHOLD) {
            const triesBeforeSpam = LIMBO_SPAM_THRESHOLD - this.limboAttempts;
            winston.info(
                `Sending to Limbo. Attempting disconnect.spam in ${triesBeforeSpam} ${
                    LIMBO_SPAM_THRESHOLD - this.limboAttempts === 1 ? 'try' : 'tries'
                }`
            );

            this.execute('§');
            this.limboAttempts++;
        } else if (this.limboAttempts === LIMBO_SPAM_THRESHOLD) {
            winston.info('Attempting disconnect.spam');

            for (let i = 0; i < 11; i++) {
                this.execute('/');
            }

            this.limboAttempts++;
        } else if (this.limboAttempts === LIMBO_SPAM_THRESHOLD + 1) {
            winston.warn('Limbo warp failed. Waiting for AFK kick');
            this.limboAttempts++;
        }
    }

    public chat(channel: 'gc' | 'oc', message: string) {
        this.bot.chat(`/${channel} ${message}`);
    }

    public async execute(message: string, catchErrors: boolean = false) {
        if (!catchErrors) {
            this.bot.chat(message);
            return null;
        }

        let listener: BotEvents['message'];
        return new Promise((resolve, reject) => {
            listener = (line) => {
                const str = line.toString();
                const motd = line.toMotd();
                const matches = motd.match(/^(.*)§c(.+)$/);

                if (matches?.length && !str.toLowerCase().includes('limbo')) {
                    reject(str);
                }
            };

            this.bot.chat(message);
            this.bot.on('message', listener);

            setTimeout(() => {
                resolve(undefined);
            }, 300);
        }).finally(() => {
            this.bot.removeListener('message', listener);
        });
    }

    public async loadEvents(bridge: Bridge) {
        this.bot.setMaxListeners(25);
        await loadEvents(path.join(__dirname, 'events/chat'), this.bot, bridge);
        await loadEvents(path.join(__dirname, 'events/handler'), this.bot, bridge);
    }
}
