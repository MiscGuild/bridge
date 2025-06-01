import { TextChannel } from 'discord.js';
import logger from 'consola';
import env from './env';

export default async (bot: any, err: Error, message?: string) => {
    logger.error(err, message ? `\n\n${message}` : undefined);

    try {
        if (!bot || !bot.discord) {
            logger.warn('Bot or bot.discord is undefined. Skipping Discord error logging.');
            return;
        }

        if (!bot.discord.isReady()) {
            logger.warn('Discord client is not ready. Skipping Discord error logging.');
            return;
        }

        const channel = await bot.discord.channels.fetch(env.ERROR_CHANNEL_ID);
        if (!channel || !(channel instanceof TextChannel)) {
            logger.warn('Error channel is invalid or not a TextChannel.');
            return;
        }

        await channel.send(err.stack ?? `${err.name}: ${err.message}`);
    } catch (e) {
        logger.error('Failed to send error to Discord:', e);
    }
};
