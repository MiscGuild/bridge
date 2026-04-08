import { escapeMarkdown } from 'discord.js';
import emojis from '../../../util/emojis';
import getRankColor from '../../../util/get-rank-color';

export default {
    name: 'chat:promoteDemote',
    runOnce: false,
    run: async (
        bridge,
        rank: string | undefined,
        playerName: string,
        type: 'promoted' | 'demoted',
        originalRank: string,
        newRank: string
    ) => {
        await bridge.discord.send(
            'gc',
            `${type === 'promoted' ? emojis.positiveEvent : emojis.negativeEvent} **${
                rank ? `${rank} ` : ''
            }${escapeMarkdown(playerName)}** was ${type} to ${newRank} from ${originalRank}!`,
            getRankColor(rank),
            true
        );
    },
} as BotEvent;
