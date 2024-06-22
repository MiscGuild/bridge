import {
    ActivityType,
    ColorResolvable,
    EmbedBuilder,
    IntentsBitField,
    TextChannel,
} from 'discord.js';
import { BotEvents, createBot } from 'mineflayer';
import EventEmitter from 'events';
import consola from 'consola';
import isObjKey from '@util/is-obj-key';
import logError from '@util/log-error';
import path from 'path';
import recursiveWalkDir from '@util/recursive-walk-dir';
import regex from '@util/regex';
import Discord from './client';

class Bot {
    public readonly logger = consola;

    public memberChannel?: TextChannel;
    public officerChannel?: TextChannel;
    public readonly ignorePrefix = process.env.DISCORD_IGNORE_PREFIX ?? ')';
    public readonly chatSeparator = process.env.MINECRAFT_CHAT_SEPARATOR ?? '>';
    public readonly discord = new Discord({
        allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
        intents: [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.MessageContent,
        ],
    });

    public onlineCount = 0;
    public totalCount = 125;
    public readonly mineflayer = createBot({
        username: process.env.MINECRAFT_EMAIL,
        password: process.env.MINECRAFT_PASSWORD ?? undefined,
        host: process.env.SERVER_ADDRESS,
        auth: 'microsoft',
        version: process.env.MINECRAFT_VERSION,
        logErrors: true,
        hideErrors: true,
        checkTimeoutInterval: 30000,
        defaultChatPatterns: false,
    });

    constructor() {
        try {
            this.start();
        } catch (error) {
            this.logger.error(error);
        }
    }

    public async sendToDiscord(
        channel: 'gc' | 'oc',
        content: string,
        color: ColorResolvable = 0x36393f,
        padMessage = false
    ) {
        const embed = new EmbedBuilder()
            .setDescription(
                padMessage ? `${'-'.repeat(54)}\n${content}\n${'-'.repeat(54)}` : content
            )
            .setColor(color);

        if (channel === 'gc') {
            await this.memberChannel?.send({ embeds: [embed] });
        } else {
            await this.officerChannel?.send({ embeds: [embed] });
        }
    }

    public sendGuildMessage(channel: 'gc' | 'oc', message: string) {
        this.executeCommand(`/${channel} ${message}`);
    }

    public executeCommand(message: string) {
        this.mineflayer.chat(message);
    }

    public async executeTask(task: string) {
        let listener: BotEvents['message'];

        await new Promise((resolve, reject) => {
            listener = (message) => {
                const str = message.toString();
                const motd = message.toMotd();
                const matches = motd.match(/^(.+)§c(.+)§r$/) ?? motd.match(/^§c(.+)$/);

                if (matches?.length && !str.toLowerCase().includes('limbo')) {
                    reject(str);
                }
            };

            this.mineflayer.chat(task);
            this.mineflayer.on('message', listener);

            setTimeout(() => {
                resolve(undefined);
            }, 300);
        }).finally(() => {
            this.mineflayer.removeListener('message', listener);
        });
    }

    public sendToLimbo() {
        this.executeCommand('§');
    }

    public setStatus() {
        const plural = this.onlineCount - 1 !== 1;

        if (this.discord.isReady()) {
            this.discord.user.setActivity(
                `${this.onlineCount - 1} online player${plural ? 's' : ''}`,
                {
                    type: ActivityType.Watching,
                }
            );
        }
    }

    private async loadCommands(dir: string) {
        const callback = async (currentDir: string, file: string) => {
            if (!(file.endsWith('.ts') || file.endsWith('.js')) || file.endsWith('.d.ts')) return;

            const command = (await import(path.join(currentDir, file))).default as Command;

            if (!command.data) {
                this.logger.warn(`The command ${path.join(currentDir, file)} doesn't have a name!`);
                return;
            }

            if (!command.run) {
                this.logger.warn(
                    `The command ${command.data.name} doesn't have an executable function!`
                );
                return;
            }

            this.discord.commands.set(command.data.name, command);
        };

        await recursiveWalkDir(
            path.join(__dirname, dir),
            callback,
            'Error while loading commands:'
        );
    }

    private async loadEvents(dir: string, emitter: EventEmitter) {
        const callback = async (currentDir: string, file: string) => {
            if (!(file.endsWith('.ts') || file.endsWith('.js')) || file.endsWith('.d.ts')) return;

            const { name, runOnce, run } = (await import(path.join(currentDir, file)))
                .default as Event;

            if (!name) {
                this.logger.warn(`The event ${path.join(currentDir, file)} doesn't have a name!`);
                return;
            }

            if (!run) {
                this.logger.warn(`The event ${name} doesn't have an executable function!`);
                return;
            }

            if (isObjKey(name, regex)) {
                this.mineflayer.addChatPattern(name.replace('chat:', ''), regex[name], {
                    repeat: true,
                    parse: true,
                });
            }

            if (runOnce) {
                emitter.once(name, run.bind(null, this));
                return;
            }

            emitter.on(name, (...args) => {
                run(this, ...args.flat(2));
            });
        };

        await recursiveWalkDir(path.join(__dirname, dir), callback, 'Error while loading events:');
    }

    private async start() {
        this.mineflayer.setMaxListeners(20);
        await Promise.all([
            this.loadCommands('../commands'),
            this.loadEvents('../events/discord', this.discord),
            this.loadEvents('../events/mineflayer', this.mineflayer),
        ]);

        await this.discord.login(process.env.DISCORD_TOKEN);
    }
}

process.on('uncaughtException', logError).on('unhandledRejection', logError);

export default Bot;
