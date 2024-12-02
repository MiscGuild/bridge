import { escapeMarkdown } from 'discord.js';
import Emojis from '@util/emojis';
import getRankColor from '@util/get-rank-color';

export default {
    name: 'chat:promoteDemote',
    runOnce: false,
    run: async (
        bot,
        rank: string | undefined,
        playerName: string,
        type: 'promoted' | 'demoted',
        originalRank: string,
        newRank: string
    ) => {
        await bot.sendToDiscord(
            'gc',
            `${type === 'promoted' ? Emojis.positiveGuildEvent : Emojis.negativeGuildEvent} **${
                rank ? `${rank} ` : ''
            }${escapeMarkdown(playerName)}** was ${type} to ${newRank} from ${originalRank}!`,
            getRankColor(rank),
            true
        );
    },
} as Event;
