// Update your existing src/mineflayer/mineflayer.ts with this enhanced version

import { createBot, Bot } from 'mineflayer';
import { consola } from 'consola';
import path from 'path';
import env from '../util/env';
import loadEvents from '../util/load-events';
import Bridge from '../bridge';

export default class Mineflayer {
    public bot!: Bot;
    public reconnecting = false;
    public limboAttempts = 0;

    constructor() {
        this.connect();
    }

    public getBot(): Bot {
        return this.bot;
    }

    public connect() {
        consola.info('Connecting to Minecraft...');

        const botOptions: any = {
            username: env.MINECRAFT_EMAIL,
            host: 'mc.hypixel.net',
            port: 25565,
            version: '1.8.9',
            auth: 'microsoft',
        };

        this.bot = createBot(botOptions);
    }

    public reconnect() {
        if (this.reconnecting) return;

        consola.warn('Disconnected from Minecraft. Attempting to reconnect...');
        this.reconnecting = true;

        setTimeout(() => this.connect(), 1000 * env.MINECRAFT_RECONNECT_DELAY);
    }

    public async execute(
        message: string,
        catchErrors: boolean = false
    ): Promise<undefined | string> {
        if (catchErrors) {
            return this.executeCommand(message);
        } else {
            this.bot.chat(message);
            return undefined;
        }
    }

    public chat(chatMode: 'gc' | 'oc', message: string) {
        const mode = chatMode === 'gc' ? '/gc' : '/oc';
        this.bot.chat(`${mode} ${message}`);
    }

    public sendToLimbo() {
        this.limboAttempts++;

        if (this.limboAttempts >= 5) {
            consola.error('Maximum limbo attempts reached. Exiting...');
            process.exit(1);
        }

        consola.info(`Sending bot to limbo (attempt ${this.limboAttempts})...`);
        this.bot.chat('/limbo');
    }

    public async executeCommand(message: string): Promise<undefined | string> {
        let listener: ((jsonMsg: any, position: string) => void) | undefined;

        return new Promise<string | undefined>((resolve, reject) => {
            listener = (jsonMsg: any, _position: string) => {
                // Extract plain text from ChatMessage object
                const str =
                    typeof jsonMsg === 'string'
                        ? jsonMsg
                        : jsonMsg?.toString
                          ? jsonMsg.toString()
                          : '';
                const matches = str.match(
                    /^\s*(\[.*\])?\s*You cannot say the same message twice!|.*(?:missing permissions?|not allowed|can't use|cannot use|usage:|>(?:.*?)Guild >.*?)\s*(\[.*\])?.*?: §c(.+)$/
                );

                if (matches?.length && !str.toLowerCase().includes('limbo')) {
                    reject(typeof str === 'string' ? str : undefined);
                }
            };

            this.bot.chat(message);
            this.bot.on('message', listener);

            setTimeout(() => {
                resolve(undefined);
            }, 300);
        }).finally(() => {
            if (listener) {
                this.bot.removeListener('message', listener);
            }
        });
    }

    public async loadEvents(bridge: Bridge) {
        this.bot.setMaxListeners(25);

        // Load core events first
        await loadEvents(path.join(__dirname, 'events/chat'), this.bot, bridge);
        await loadEvents(path.join(__dirname, 'events/handler'), this.bot, bridge);

        // Register extension chat patterns with message listener
        consola.info('Registering extension chat patterns...');
        this.registerExtensionPatterns(bridge);
        consola.info('Extension patterns registered!');
    }

    private registerExtensionPatterns(bridge: Bridge) {
        // Get all chat patterns from the extension manager
        const chatPatterns = bridge.extensionManager.getAllChatPatterns();

        consola.info(`Registering ${chatPatterns.length} extension chat patterns`);

        // Note: The Extension Manager already has its own central chat listener
        // in setupCentralChatListener(), so we don't need to add another one here
        // to avoid duplicate message processing.

        consola.debug('Extension Manager is handling chat message routing');
    }

    private isCorePattern(eventName: string): boolean {
        // List of core pattern names to avoid double-registration
        const corePatterns = [
            'chat:commentBlocked',
            'chat:guildChat',
            'chat:guildLevelUp',
            'chat:guildMuteUnmute',
            'chat:joinLeave',
            'chat:joinLimbo',
            'chat:lobbyJoin',
            'chat:joinRequest',
            'chat:memberCount',
            'chat:memberJoinLeave',
            'chat:memberKick',
            'chat:promoteDemote',
            'chat:questComplete',
            'chat:questTierComplete',
            'chat:sameMessageTwice',
            'chat:whisper',
        ];

        return corePatterns.includes(eventName);
    }

    public reconnectOrExit(bridge: Bridge) {
        if (this.reconnecting) {
            consola.error('Exiting due to failed reconnect attempt');
            process.exit(1);
        }

        consola.info('Attempting to reconnect...');
        this.reconnecting = true;

        // Close current connection
        if (this.bot) {
            this.bot.end();
        }

        // Recreate connection after delay
        setTimeout(() => {
            this.connect();
            this.loadEvents(bridge);
        }, 5000);
    }
}
