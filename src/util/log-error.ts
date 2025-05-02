import { TextChannel } from 'discord.js';
import logger from 'consola';
import env from './env';

export default async (bot: any, err: Error, message?: string) => {
    logger.error(err, message ? `\n\n${message}` : undefined);

    if (bot.discord.isReady()) {
        ((await bot.discord.channels.fetch(env.ERROR_CHANNEL_ID)) as TextChannel).send(
            err.stack ?? `${err.name}: ${err.message}`
        );
    }
};
