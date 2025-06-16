import { escapeMarkdown } from 'discord.js';
import Emojis from '../../../util/emojis';
import fetchMojangProfile from '../../../requests/fetch-mojang-profile';
import isFetchError from '../../../requests/is-fetch-error';
import isUserBlacklisted from '../../../blacklist/is-user-blacklisted';

import getRankColor from '../../../util/get-rank-color';
import env from '../../../util/env';
import getRandomHexColor from '../../../util/getRandomHexColor';

/**
 * If a joining player's Mojang profile is blacklisted, kick them from the guild.
 */
async function checkAndKickIfBlacklisted(bot: any, playerName: string): Promise<void> {
    const profile = await fetchMojangProfile(playerName);
    if (!isFetchError(profile)) {
        if (profile && 'id' in profile && isUserBlacklisted(profile.id)) {
            setTimeout(() => {
                bot.executeCommand(
                    `/g kick ${playerName} You have been blacklisted from the guild. Apply on the Discord server: .gg/miscellaneous`
                );
            }, 2000);
        }
    }
}

/**
 * Sends a Discord message to announce a join or leave event.
 */
async function sendGuildEventMessage(
    bot: any,
    rank: string | undefined,
    playerName: string,
    type: 'joined' | 'left'
): Promise<void> {
    const message = `${
        type === 'joined' ? Emojis.positiveGuildEvent : Emojis.negativeGuildEvent
    } **${rank ? `${rank} ` : ''}${escapeMarkdown(playerName)}** ${type} the guild!`;
    await bot.sendToDiscord('gc', message, getRankColor(rank), true);
}

/**
 * Handles the join event.
 */
async function processJoinEvent(bot: any, playerName: string, mojangProfile: any): Promise<void> {
    const response = await fetch(
        `https://api.hypixel.net/guild?key=${env.HYPIXEL_API_KEY}&name=${env.HYPIXEL_GUILD_NAME}`
    );
    const data = await response.json();

    if (!data.success || !data.guild) {
        bot.executeCommand(`/oc Failed to get guild data of recently joined member ${playerName}.`);
        throw new Error('Hypixel API failed to return guild data');
    }

    if (isFetchError(mojangProfile)) {
        bot.executeCommand(`/oc Failed to get guild data of recently joined member ${playerName}.`);
        throw new Error('Playername was invalid. Error with regex or unusual username');
    }

    const { guild } = data;
    const members = guild.members.find(
        (member: { uuid: string }) => member.uuid === mojangProfile.id
    );

    if (!members) {
        bot.executeCommand(`/oc Player ${playerName} doesn't seem to be in the guild according to the Hypixel API. | ${getRandomHexColor}`);
        throw new Error("Player doesn't seem to be in the guild on the Hypixel API");
    }

    bot.executeCommand(`/g log ${playerName} 1`);

    await new Promise<void>((resolve) => {
        bot.mineflayer.once('message', async (message: any) => {
            const messageContent = message.toString();
            const logEntries = messageContent.split('\n');

            const regex =
                /(([A-Za-z]{3}\s[0-9]{1,2}\s[0-9]{4}) (([0-9]{2}):([0-9]{2})) ((EDT|EST))): ([A-Za-z0-9-_]{2,27}) (joined|left|invited|kicked|muted|unmuted|set rank of|set MOTD|set guild tag|set guild tagcolor|set Discord|turned the chat throttle on|turned the chat throttle off)( ([A-Za-z0-9-_]{2,27})?)?( for | to |: )?([ A-Za-z0-9\-!_\\s]+)?/;
            const validEntries = logEntries.filter((entry: string) => regex.test(entry));

            if (validEntries.length >= 1) {
                if (validEntries[1]?.includes('invited')) {
                    bot.sendToDiscord(
                        'oc',
                        `Player **${escapeMarkdown(
                            playerName
                        )}** joined the guild!\n\nThey were invited by **${
                            validEntries[1].split(' ')[5]
                        }**.`
                    );
                } else {
                    bot.sendToDiscord(
                        'oc',
                        `Player **${escapeMarkdown(
                            playerName
                        )}** joined the guild!\n\nThey weren't invited by anyone.`
                    );
                }
                resolve();
            } else {
                bot.sendToDiscord(
                    'oc',
                    `[DEBUG] ${playerName} joined the guild, but failed to get invite data.`
                );
                throw new Error('Invite data not found');
            }
        });
    });
}

/**
 * Handles the leave event.
 */
async function processLeaveEvent(bot: any, playerName: string): Promise<void> {
    bot.sendToDiscord('oc', `Player **${escapeMarkdown(playerName)}** left the guild!`);
}

export default {
    name: 'chat:memberJoinLeave',
    runOnce: false,
    run: async (
        bot: any,
        rank: string | undefined,
        playerName: string,
        type: 'joined' | 'left'
    ) => {
        if (type === 'joined') {
            await checkAndKickIfBlacklisted(bot, playerName);
        }

        await sendGuildEventMessage(bot, rank, playerName, type);

        const mojangProfile = await fetchMojangProfile(playerName);
        if (isFetchError(mojangProfile)) {
            bot.executeCommand(
                `/oc Failed to get Mojang profile of ${playerName}. Please try again later.`
            );
            throw new Error('Playername was invalid. Error with regex or unusual username');
        }

        if (type === 'joined') {
            await processJoinEvent(bot, playerName, mojangProfile);
        }
        if (type === 'left') {
            await processLeaveEvent(bot, playerName);
        }
    },
} as Event;
