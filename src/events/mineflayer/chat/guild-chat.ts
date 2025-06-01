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
        const content = ` **${rank ? `${rank} ` : ''}${escapeMarkdown(playerName)}${
            guildRank ? ` ${guildRank}` : ''
        }:** ${escapeMarkdown(message)}`;

        await bot.sendToDiscord(channel === 'Guild' ? 'gc' : 'oc', content, getRankColor(rank));
    },
} as Event;
