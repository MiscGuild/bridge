import Emojis from '../../../util/emojis';
import { escapeMarkdown } from 'discord.js';
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

        console.log(
            `[DEBUG] ${playerName} was kicked by ${kickedByPlayerName}. Trying to log this...`
        );

        const mojangProfile = await fetchMojangProfile(playerName);
        if (isFetchError(mojangProfile)) {
            bot.executeCommand(
                `/oc Failed to get Mojang profile of ${playerName}. Please try again later.`
            );
            return;
        } else {
            console.log(`[DEBUG] Found Mojang profile of ${playerName}. ID: ${mojangProfile.id}`);
        }

        return new Promise((resolve, reject) => {
            fetch(
                `https://api.hypixel.net/guild?key=${env.HYPIXEL_API_KEY}&name=${env.HYPIXEL_GUILD_NAME}`
            )
                .then((response) => response.json())
                .then((data) => {
                    if (data.success === false) {
                        console.log(
                            `[DEBUG] ${playerName} left the guild, but failed to get guild data.`
                        );
                        bot.executeCommand(
                            `/oc Failed to get guild data of recently left member ${playerName}. Please try again later.`
                        );
                        return reject('Guild data not found!');
                    } else if (data.success === true && data.guild === null) {
                        console.log(
                            `[DEBUG] ${playerName} left the guild, but failed to get guild data.`
                        );
                        bot.executeCommand(
                            `/oc Failed to get guild data of recently left member ${playerName}. Please try again later.`
                        );
                        return reject('Guild data not found!');
                    }

                    if (isFetchError(mojangProfile)) {
                        console.log(
                            `[DEBUG] ${playerName} left the guild, but failed to get guild data.`
                        );
                        bot.executeCommand(
                            `/oc Failed to get guild data of recently left member ${playerName}. Please try again later. It's safe to assume they left the guild within 5 minutes.`
                        );
                        return reject('Guild data not found!');
                    } else {
                        const oldJoinData = require('./joindata.json');
                        const joinDate = oldJoinData[mojangProfile.id];
                        const leaveDate = new Date();

                        const timeDiff = Math.abs(
                            new Date(leaveDate).getTime() - new Date(joinDate).getTime()
                        );
                        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                        const formattedLeaveDate =
                            diffDays > 1
                                ? new Date(joinDate).toLocaleString('en-US', {
                                      timeZone: 'Europe/Amsterdam',
                                  })
                                : new Date(joinDate).toLocaleString('en-US', {
                                      timeZone: 'Europe/Amsterdam',
                                  });

                        bot.sendToDiscord(
                            'oc',
                            `Player **${escapeMarkdown(
                                playerName
                            )}** left the guild! Their join date was ||${formattedLeaveDate}||. They stayed in the guild for **${diffDays}** days. `
                        );
                        console.log(
                            `[DEBUG] ${playerName} left the guild, successfully logged this event.`
                        );
                        return resolve();
                    }
                });
        });
    },
} as Event;
