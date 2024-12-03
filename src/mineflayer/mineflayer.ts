import env from '@util/env';
import { BotEvents, createBot } from 'mineflayer';
import winston from 'winston';
import path from 'path';
import loadEvents from '@util/load-events';
import Bridge from '../bridge';

export default class Mineflayer {
    public limboTries = 0;
    private bot = createBot({
        username: env.MINECRAFT_EMAIL,
        password: env.MINECRAFT_PASSWORD,
        host: 'mc.hypixel.net',
        auth: 'microsoft',
        version: '1.20',
        defaultChatPatterns: false,
    });

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
                const matches = motd.match(/^(.+)§c(.+)§r$/) ?? motd.match(/^§c(.+)$/);

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

    public sendToLimbo() {
        const SPAM_THRESHOLD = 3;

        if (this.limboTries < SPAM_THRESHOLD) {
            const triesBeforeSpam = SPAM_THRESHOLD - this.limboTries;
            winston.info(
                `Sending to Limbo. Attempting disconnect.spam in ${triesBeforeSpam} ${
                    SPAM_THRESHOLD - this.limboTries === 1 ? 'try' : 'tries'
                }`
            );

            this.execute('§');
            this.limboTries++;
        } else if (this.limboTries === SPAM_THRESHOLD) {
            winston.info('Attempting disconnect.spam');

            for (let i = 0; i < 11; i++) {
                this.execute('/');
            }

            this.limboTries++;
        } else if (this.limboTries === SPAM_THRESHOLD + 1) {
            winston.warn('Limbo warp failed. Waiting for AFK kick');
            this.limboTries++;
        }
    }

    public async loadEvents(bridge: Bridge) {
        this.bot.setMaxListeners(25);
        await loadEvents(path.join(__dirname, 'events/chat'), this.bot, bridge);
        await loadEvents(path.join(__dirname, 'events/handler'), this.bot, bridge);
    }
}
