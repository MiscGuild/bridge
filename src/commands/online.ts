import { EmbedBuilder } from 'discord.js';

const regex = {
    bound: /-----------------------------------------------------/,
    guildRank: /-- (.+) --/,
    playerOnlineStatus: /([^ ]+) ●/g,
    onlineMembers: /Online Members: (\d+)/,
};

export default {
    data: {
        name: 'online',
        description: 'List all online players',
    },
    run: async (bot, interaction) => {
        let repliedToInteraction = false;
        let boundReceived = 0;
        let currentGuildRank: string | null = null;
        const players: { [name: string]: Array<string> } = {};
        const listener = (message: string) => {
            if (regex.bound.test(message)) {
                boundReceived++;
            }
            if (boundReceived === 0) {
                return;
            }
            const newGuildRank = regex.guildRank.exec(message)?.at(1);
            if (newGuildRank) {
                currentGuildRank = newGuildRank;
                return;
            }
            if (boundReceived > 0 && currentGuildRank) {
                const usernameMatches = message.matchAll(regex.playerOnlineStatus);
                // eslint-disable-next-line no-restricted-syntax
                for (const usernameMatch of usernameMatches) {
                    const username = usernameMatch.at(1);
                    if (username) {
                        players[currentGuildRank] ??= [];
                        players[currentGuildRank]?.push(username);
                    }
                }
            }
            if (boundReceived >= 2) {
                const playerCount = regex.onlineMembers.exec(message)?.at(1);

                bot.mineflayer.removeListener('messagestr', listener);
                const embed = new EmbedBuilder().setColor('Green').setTitle(`Online Players [${playerCount}/${bot.totalCount}]`);

                Object.entries(players).forEach(([guildRank, usernames]) => {
                    embed.addFields({ name: guildRank, value: `\`${usernames.join(' ')}\`` });
                });

                interaction.reply({ embeds: [embed] }).then(() => {
                    repliedToInteraction = true;
                });
            }
        };
        bot.mineflayer.on('messagestr', listener);
        bot.mineflayer.chat('/g online');
        // If the command takes longer than 2 seconds to finish, something probably went wrong
        setTimeout(() => {
            bot.mineflayer.removeListener('messagestr', listener);
            if (repliedToInteraction) {
                return;
            }

            // Send an error reply if the listener failed for any reason
            const embed = new EmbedBuilder().setColor('Red').setTitle('Online players');
            embed.addFields({ name: 'Error', value: 'Failed to get online players, please retry later' });
            interaction.reply({ embeds: [embed] });
        }, 2000);
    },
} as Command;