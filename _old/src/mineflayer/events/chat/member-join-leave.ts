import emojis from '../../../util/emojis';
import { escapeMarkdown } from 'discord.js';
import fetchMojangProfile from '../../../requests/fetch-mojang-profile';
import isFetchError from '../../../requests/is-fetch-error';
import isUserBlacklisted from '../../../blacklist/is-user-blacklisted';
import getRankColor from '../../../util/get-rank-color';
import env from '../../../util/env';

export default {
    name: 'chat:memberJoinLeave',
    runOnce: false,
    run: async (bridge, rank: string | undefined, playerName: string, type: 'joined' | 'left') => {
        if (type === 'joined') {
            const mojangProfile = await fetchMojangProfile(playerName);

            if (!isFetchError(mojangProfile) && isUserBlacklisted(mojangProfile.id)) {
                bridge.mineflayer.execute(
                    `/g kick ${playerName} You have been blacklisted from the guild. Mistake? --> ${env.DISCORD_INVITE_LINK}`
                );
            }
        }

        await bridge.discord.send(
            'gc',
            `${type === 'joined' ? emojis.positiveEvent : emojis.negativeEvent} **${
                rank ? `${rank} ` : ''
            }${escapeMarkdown(playerName)}** ${type} the guild!`,
            getRankColor(rank),
            true
        );
    },
} as BotEvent;
