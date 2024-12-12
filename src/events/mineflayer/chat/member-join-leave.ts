import Emojis from '@util/emojis';
import { escapeMarkdown } from 'discord.js';
import fetchMojangProfile from '@requests/fetch-mojang-profile';
import isFetchError from '@requests/is-fetch-error';
import isUserBlacklisted from '@blacklist/is-user-blacklisted';
import { BotEvents } from 'mineflayer';

import getRankColor from '@util/get-rank-color';
import env from '@util/env';

export default {
    name: 'chat:memberJoinLeave',
    runOnce: false,
    run: async (bot, rank: string | undefined, playerName: string, type: 'joined' | 'left') => {
        if (type === 'joined') {
            const mojangProfile = await fetchMojangProfile(playerName);

            if (!isFetchError(mojangProfile) && isUserBlacklisted(mojangProfile.id)) {
                bot.executeCommand(
                    `/g kick ${playerName} You have been blacklisted from the guild. Mistake? --> ${env.DISCORD_INVITE_LINK}`
                );
            }
        }

        await bot.sendToDiscord(
            'gc',
            `${type === 'joined' ? Emojis.positiveGuildEvent : Emojis.negativeGuildEvent} **${
                rank ? `${rank} ` : ''
            }${escapeMarkdown(playerName)}** ${type} the guild!`,
            getRankColor(rank),
            true
        );

        const mojangProfile = await fetchMojangProfile(playerName);
        if (isFetchError(mojangProfile)) {
            bot.executeCommand(`/oc Failed to get Mojang profile of ${playerName}. Please try again later.`);
            return;
        } else {
            console.log(`[DEBUG] Found Mojang profile of ${playerName}. ID: ${mojangProfile.id}`);
        }

        if (type === 'joined') {
            // Join Date
            return new Promise((resolve, reject) => {
                fetch(`https://api.hypixel.net/guild?key=${env.HYPIXEL_API_KEY}&name=${env.HYPIXEL_GUILD_NAME}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.success === false) {
                    console.log(`[DEBUG] ${playerName} joined the guild, but failed to get guild data.`);
                    bot.executeCommand(`/oc Failed to get guild data of recently joined member ${playerName}. Please try again later.`);
                    return reject('Guild data not found!');
                } else if (data.success === true && data.guild === null) {
                    console.log(`[DEBUG] ${playerName} joined the guild, but failed to get guild data.`);
                    bot.executeCommand(`/oc Failed to get guild data of recently joined member ${playerName}. Please try again later.`);
                    return reject('Guild data not found!');
                };

                if (isFetchError(mojangProfile)) {
                    console.log(`[DEBUG] ${playerName} joined the guild, but failed to get guild data.`);
                    bot.executeCommand(`/oc Failed to get guild data of recently joined member ${playerName}. Please try again later. ()`);
                    return reject('Guild data not found!');
                } else { 
                    
                    const guild = data.guild;
                    const member = guild.members.find((member: { uuid: string; }) => member.uuid === mojangProfile.id);

                    if (!member) {
                        console.log(`[DEBUG] ${playerName} joined the guild, but failed to get guild data.`);
                        bot.executeCommand(`/oc Failed to get guild data of recently joined member ${playerName}. Please try again later.`);
                        return reject('Guild data not found!');
                    }

                    const joinDatetoSend = new Date(member.joined).toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' });
                    const joinDate = new Date(member.joined);

                    const fs = require('fs');
                    const path = require('path');
                    const filePath = path.resolve(__dirname, 'joindata.json');
                    if (!fs.existsSync(filePath)) {
                        fs.writeFileSync(filePath, '{}');
                    }

                    const _joinData = require('./joindata.json');
                    if (_joinData[mojangProfile.id]) {
                        delete _joinData[mojangProfile.id];
                        _joinData[mojangProfile.id] = joinDate;
                        fs.writeFileSync(filePath, JSON.stringify(_joinData, null, 4));
                    } else {
                        _joinData[mojangProfile.id] = joinDate;
                        fs.writeFileSync(filePath, JSON.stringify(_joinData, null, 4));
                        console.log(`[DEBUG] ${playerName} joined the guild, wrote join data to file.`);
                    }

                    bot.sendToDiscord(
                        'oc',
                        `Player **${escapeMarkdown(playerName)}** joined the guild! Their join date is ||${joinDatetoSend}||. `,
                    )

                    // Second Part

                    bot.executeCommand(`/g log ${playerName} 1`);
                    const logEntriesArray = [] as string[];
                    let chatListener2: BotEvents["message"];
                    bot.mineflayer.on(
                        "message",
                        (chatListener2 = async (message) => {
                            const messageContent = message.toString();
                            let counter = 0;
                            const logEntries = messageContent.split("\n");

                            for (const logEntry of logEntries) {
                                const regex = new RegExp(/(([A-Za-z]{3}\s[0-9]{1,2}\s[0-9]{4}) (([0-9]{2}):([0-9]{2})) ((EDT|EST))): ([A-Za-z-0-9-_]{2,27}) (joined|left|invited|kicked|muted|unmuted|set rank of|set MOTD|set guild tag|set guild tagcolor|set Discord|turned the chat throttle on|turned the chat throttle off)( ([A-Za-z-0-9-_]{2,27})?)?( for | to |: )?([ A-Za-z-0-9-!-_\\s]+)?/g
                                );

                            let match;

                            while ((match = regex.exec(logEntry)) !== null && counter <= 2) {
								logEntriesArray.push(match[0]);
								counter++;

								const [
									fullMatch,
									date,
									time,
									hour,
									minute,
									timezone,
									year,
									primaryUsername,
									action,
									day,
									secondUsername,
									additionalInfo,
								] = match;

								if (counter === 2 && action === "invited") {
									const invitedPlayer = secondUsername as string;
									const userName = primaryUsername as string;
                                    
                                    bot.sendToDiscord(
                                        'oc',
                                        `Player **${escapeMarkdown(userName)}** invited **${escapeMarkdown(invitedPlayer)}** to the guild!`,
                                    )
                                } else if (counter === 2) {

                                    
                                    bot.sendToDiscord(
                                        'oc',
                                        `Player **${escapeMarkdown(playerName)}** ${action} the guild! **They weren't invited by anyone.**`,
                                    )
                                }
                            }
                            }
                        }))
                    return resolve();
                }
                })
        });
    } else if (type === 'left') {
            return new Promise((resolve, reject) => {
                fetch(`https://api.hypixel.net/guild?key=${env.HYPIXEL_API_KEY}&name=${env.HYPIXEL_GUILD_NAME}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.success === false) {
                    console.log(`[DEBUG] ${playerName} left the guild, but failed to get guild data.`);
                    bot.executeCommand(`/oc Failed to get guild data of recently left member ${playerName}. Please try again later.`);
                    return reject('Guild data not found!');
                } else if (data.success === true && data.guild === null) {
                    console.log(`[DEBUG] ${playerName} left the guild, but failed to get guild data.`);
                    bot.executeCommand(`/oc Failed to get guild data of recently left member ${playerName}. Please try again later.`);
                    return reject('Guild data not found!');
                };

                if (isFetchError(mojangProfile)) {
                    console.log(`[DEBUG] ${playerName} left the guild, but failed to get guild data.`);
                    bot.executeCommand(`/oc Failed to get guild data of recently left member ${playerName}. Please try again later. It's safe to assume they left the guild within 5 minutes.`);
                    return reject('Guild data not found!');
                } else { 
                    

                    const oldJoinData = require('./joindata.json');
                    const joinDate = oldJoinData[mojangProfile.id];
                    const leaveDate = new Date();

                    const timeDiff = Math.abs(new Date(leaveDate).getTime() - new Date(joinDate).getTime());
                    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    const formattedLeaveDate = diffDays > 1 ? new Date(joinDate).toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }) : new Date(joinDate).toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' });

                    bot.sendToDiscord(
                        'oc',
                        `Player **${escapeMarkdown(playerName)}** left the guild! Their join date was ||${formattedLeaveDate}||. They stayed in the guild for **${diffDays}** days. `,
                    )
                    return resolve();
                }
            })
        })}
    }
} as Event;
