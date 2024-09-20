import { TextChannel } from 'discord.js';
import logger from 'consola';
import env from '@util/env';
import bot from '..';

const logError = async (err: Error) => {
    logger.error(err);

    if (bot.discord.isReady()) {
        ((await bot.discord.channels.fetch(env.ERROR_CHANNEL_ID)) as TextChannel).send(
            err.stack ?? `${err.name}: ${err.message}`
        );
    }
};

export default logError;

export const logCustomError = async (err: Error, message: string) => {
    logger.error(message);
    await logError(err);
};