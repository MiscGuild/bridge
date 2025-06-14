import { escapeMarkdown } from 'discord.js';
import logger from 'consola';
import Emojis from '../../../util/emojis';
import fetchMojangProfile from '../../../requests/fetch-mojang-profile';
import isFetchError from '../../../requests/is-fetch-error';
import env from '../../../util/env';

export default {
    name: 'chat:memberKick',
    runOnce: false,
    run: async (
        bot,
        rank: string | undefined,
        playerName: string,
        kickedByRank: string | undefined,
        kickedByPlayerName: string
    ) => {
        await bot.sendToDiscord(
            'gc',
            `${Emojis.negativeGuildEvent} **${rank ? `${rank} ` : ''}${escapeMarkdown(
                playerName
            )}** was kicked by **${kickedByRank ? `${kickedByRank} ` : ''}${escapeMarkdown(
                kickedByPlayerName
            )}**`,
            undefined,
            true
        );

        logger.log(
            `[DEBUG] ${playerName} was kicked by ${kickedByPlayerName}. Trying to log this...`
        );

        const mojangProfile = await fetchMojangProfile(playerName);
        if (isFetchError(mojangProfile)) {
            bot.executeCommand(
                `/oc Failed to get Mojang profile of ${playerName}. Please try again later.`
            );
            return;
        }

        try {
            const response = await fetch(
                `https://api.hypixel.net/guild?key=${env.HYPIXEL_API_KEY}&name=${env.HYPIXEL_GUILD_NAME}`
            );
            const data = await response.json();

            if (!data.success || data.guild === null) {
                logger.log(`[DEBUG] ${playerName} was kicked, but failed to get guild data.`);
                bot.executeCommand(
                    `/oc Failed to get guild data of recently kicked member ${playerName}. Please try again later. It's safe to assume they left the guild within 5 minutes.`
                );
                return;
            }

            bot.sendToDiscord(
                'oc',
                `Player **${escapeMarkdown(
                    playerName
                )}** was kicked from the guild by ${escapeMarkdown(kickedByPlayerName)}!`
            );

            logger.log(`[DEBUG] ${playerName} was kicked and the event was logged.`);
        } catch (error) {
            logger.error(`[ERROR] Failed to handle memberKick event: ${error}`);
            bot.executeCommand(
                `/oc An error occurred while trying to log the kick event for ${playerName}.`
            );
        }
    },
} as Event;
