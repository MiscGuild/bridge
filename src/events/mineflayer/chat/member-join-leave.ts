import Emojis from '@util/emojis';
import { escapeMarkdown } from 'discord.js';
import fetchMojangProfile from '@util/requests/fetch-mojang-profile';
import isFetchError from '@util/requests/is-fetch-error';
import isUserBlacklisted from '@util/blacklist/is-user-blacklisted';
import getRankColor from '@util/get-rank-color';

export default {
    name: 'chat:memberJoinLeave',
    runOnce: false,
    run: async (bot, rank: string | undefined, playerName: string, type: 'joined' | 'left') => {
        if (type === 'joined') {
            const mojangProfile = await fetchMojangProfile(playerName);

            if (!isFetchError(mojangProfile) && isUserBlacklisted(mojangProfile.id)) {
                bot.executeCommand(
                    `/g kick ${playerName} You have been blacklisted from the guild. Mistake? --> ${process.env.DISCORD_INVITE_LINK}`
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
    },
} as Event;
