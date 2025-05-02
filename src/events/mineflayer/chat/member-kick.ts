import fs from 'fs/promises';
import path from 'path';

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

        logger.log(`[DEBUG] Found Mojang profile of ${playerName}. ID: ${mojangProfile.id}`);

        try {
            const response = await fetch(
                `https://api.hypixel.net/guild?key=${env.HYPIXEL_API_KEY}&name=${env.HYPIXEL_GUILD_NAME}`
            );
            const data = await response.json();

            if (!data.success || data.guild === null || isFetchError(mojangProfile)) {
                logger.log(`[DEBUG] ${playerName} left the guild, but failed to get guild data.`);
                bot.executeCommand(
                    `/oc Failed to get guild data of recently left member ${playerName}. Please try again later. It's safe to assume they left the guild within 5 minutes.`
                );
                return;
            }

            const filePath = path.resolve(__dirname, 'joindata.json');
            const fileContent = await fs.readFile(filePath, 'utf8');
            const oldJoinData = JSON.parse(fileContent);
            const joinDate = oldJoinData[mojangProfile.id];
            const leaveDate = new Date();

            const timeDiff = Math.abs(new Date(leaveDate).getTime() - new Date(joinDate).getTime());
            const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            const formattedLeaveDate = new Date(joinDate).toLocaleString('en-US', {
                timeZone: 'Europe/Amsterdam',
            });

            bot.sendToDiscord(
                'oc',
                `Player **${escapeMarkdown(
                    playerName
                )}** was kicked from the guild by ${kickedByPlayerName}! Their join date was ||${formattedLeaveDate}||. They stayed in the guild for **${diffDays}** days.`
            );

            logger.log(`[DEBUG] ${playerName} left the guild, successfully logged this event.`);
        } catch (error) {
            logger.error(`[ERROR] Failed to handle memberKick event: ${error}`);
            bot.executeCommand(
                `/oc An error occurred while trying to log the kick event for ${playerName}.`
            );
        }
    },
} as Event;
