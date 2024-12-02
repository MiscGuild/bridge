import Emojis from '@util/emojis';
import { escapeMarkdown } from 'discord.js';

export default {
    name: 'chat:memberKick',
    runOnce: false,
    run: async (
        bot,
        rank: string | undefined,
        playerName: string,
        kickerRank: string | undefined,
        kickerName: string
    ) => {
        await bot.sendToDiscord(
            'gc',
            `${Emojis.negativeGuildEvent} **${rank ? `${rank} ` : ''}${escapeMarkdown(
                playerName
            )}** was kicked by **${kickerRank ? `${kickerRank} ` : ''}${escapeMarkdown(
                kickerName
            )}**`,
            undefined,
            true
        );
    },
} as Event;
