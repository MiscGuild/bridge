import { escapeMarkdown } from 'discord.js';
import getRankColor from '../../../util/get-rank-color';

export default {
    name: 'chat:guildChat',
    runOnce: false,
    run: async (
        bot,
        channel: 'Guild' | 'Officer',
        rank: string | undefined,
        playerName: string,
        guildRank: string | undefined,
        message: string
    ) => {
        const safePlayerName = typeof playerName === 'string' ? playerName : '[Unknown]';
        const safeMessage = typeof message === 'string' ? message : '';

        const content = ` **${rank ? `${rank} ` : ''}${escapeMarkdown(safePlayerName)}${
            guildRank ? ` ${guildRank}` : ''
        }:** ${escapeMarkdown(safeMessage)}`;

        await bot.sendToDiscord(channel === 'Guild' ? 'gc' : 'oc', content, getRankColor(rank));
    },
} as Event;
