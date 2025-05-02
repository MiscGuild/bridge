import { promises as fs } from 'fs';
import path from 'path';
import { escapeMarkdown } from 'discord.js';
import logger from 'consola';
import Emojis from '../../../util/emojis';
import fetchMojangProfile from '../../../requests/fetch-mojang-profile';
import isFetchError from '../../../requests/is-fetch-error';
import isUserBlacklisted from '../../../blacklist/is-user-blacklisted';

import getRankColor from '../../../util/get-rank-color';
import env from '../../../util/env';

/**
 * If a joining player's Mojang profile is blacklisted, kick them from the guild.
 */
async function checkAndKickIfBlacklisted(bot: any, playerName: string): Promise<void> {
    const profile = await fetchMojangProfile(playerName);
    if (!isFetchError(profile) && isUserBlacklisted(profile.id)) {
        // Wait for 2 seconds before kicking the player to avoid API being overloaded.
        setTimeout(() => {
            bot.executeCommand(
                `/g kick ${playerName} You have been blacklisted from the guild. Apply on the Discord server: .gg/miscellaneous`
            );
        }, 2000);
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
 * Handles the join event:
 * - Fetches guild data from the Hypixel API.
 * - Finds the member’s join date.
 * - Writes the join date to a JSON file.
 * - Executes a log command and listens for the invite log message.
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
        bot.executeCommand(`/oc Failed to get guild data of recently joined member ${playerName}.`);
        throw new Error("Player doesn't seem to be in the guild on the Hypixel API");
    }

    const joinDate = new Date(members.joined).toLocaleString('en-US', {
        timeZone: 'Europe/Amsterdam',
    });

    const filePath = path.resolve(__dirname, 'joindata.json');

    try {
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, '{}');
    }

    const fileContent = await fs.readFile(filePath, 'utf8');
    const joinData = JSON.parse(fileContent);
    const alreadyExisted = Object.prototype.hasOwnProperty.call(joinData, mojangProfile.id);
    joinData[mojangProfile.id] = joinDate;
    await fs.writeFile(filePath, JSON.stringify(joinData, null, 4));

    if (!alreadyExisted) {
        logger.log(`[DEBUG] ${playerName} joined the guild, wrote join data to file.`);
    }

    bot.executeCommand(`/g log ${playerName} 1`);

    // Listen for the log message to extract invite information.
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
                        )}** joined the guild! Their join date is ||${joinDate}||.\n\nThey were invited by **${
                            validEntries[1].split(' ')[5]
                        }**.`
                    );
                } else {
                    bot.sendToDiscord(
                        'oc',
                        `Player **${escapeMarkdown(
                            playerName
                        )}** joined the guild! Their join date is ||${joinDate}||.\n\nThey weren't invited by anyone.`
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
 * Handles the leave event:
 * - Fetches guild data.
 * - Reads the join date from the JSON file.
 * - Calculates how many days the member was in the guild.
 * - Sends a Discord message with the information.
 */
async function processLeaveEvent(bot: any, playerName: string, mojangProfile: any): Promise<void> {
    const response = await fetch(
        `https://api.hypixel.net/guild?key=${env.HYPIXEL_API_KEY}&name=${env.HYPIXEL_GUILD_NAME}`
    );
    const data = await response.json();

    if (!data.success || !data.guild) {
        bot.executeCommand(`/oc Failed to get guild data of recently left member ${playerName}.`);
        throw new Error('Guild data not found!');
    }

    if (isFetchError(mojangProfile)) {
        bot.executeCommand(`/oc Failed to get guild data of recently left member ${playerName}.`);
        throw new Error('Guild data not found!');
    }

    const filePath = path.resolve(__dirname, 'joindata.json');
    const fileContent = await fs.readFile(filePath, 'utf8');
    const oldJoinData = JSON.parse(fileContent);
    const joinDate = oldJoinData[mojangProfile.id];
    const leaveDate = new Date();

    const timeDiff = Math.abs(leaveDate.getTime() - new Date(joinDate).getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const formattedJoinDate = new Date(joinDate).toLocaleString('en-US', {
        timeZone: 'Europe/Amsterdam',
    });

    bot.sendToDiscord(
        'oc',
        `Player **${escapeMarkdown(
            playerName
        )}** left the guild! Their join date was ||${formattedJoinDate}||. They stayed in the guild for **${diffDays}** days.`
    );
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
            processJoinEvent(bot, playerName, mojangProfile);
        }
        if (type === 'left') {
            processLeaveEvent(bot, playerName, mojangProfile);
        }
    },
} as Event;
