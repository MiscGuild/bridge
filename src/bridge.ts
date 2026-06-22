import { ActivityType, IntentsBitField } from 'discord.js';
import winston from 'winston';
import env from '@util/env';
import Discord from '@discord/discord';
import Mineflayer from '@mineflayer/mineflayer';

export default class Bridge {
    public readonly discord = new Discord({
        allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
        intents: [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.MessageContent,
        ],
    });

    public readonly mineflayer = new Mineflayer();
    public onlineCount = 0;
    public totalCount = 125;

    constructor() {
        try {
            this.start();
        } catch (error) {
            winston.error(error);
        }
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

    private async start() {
        await Promise.all([
            this.discord.loadCommands(),
            this.discord.loadEvents(this),
            this.mineflayer.loadEvents(this),
        ]);

        await this.discord.login(env.DISCORD_TOKEN);
    }
}

const handleError = (e: Error) => winston.error(e);
process.on('uncaughtException', handleError).on('unhandledRejection', handleError);
