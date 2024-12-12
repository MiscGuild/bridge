import { escapeMarkdown } from 'discord.js';
import Emojis from '../../../util/emojis';
import getRankColor from '../../../util/get-rank-color';

export default {
    name: 'chat:promoteDemote',
    runOnce: false,
    run: async (
        bot,
        rank: string | undefined,
        playerName: string,
        type: 'promoted' | 'demoted',
        guildRankFrom: string,
        guildRankTo: string
    ) => {
        await bot.sendToDiscord(
            'gc',
            `${type === 'promoted' ? Emojis.positiveGuildEvent : Emojis.negativeGuildEvent} **${
                rank ? `${rank} ` : ''
            }${escapeMarkdown(playerName)}** was ${type} to ${guildRankTo} from ${guildRankFrom}!`,
            getRankColor(rank),
            true
        );
    },
} as Event;
