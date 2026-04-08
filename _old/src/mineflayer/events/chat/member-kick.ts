import emojis from '../../../util/emojis';
import { escapeMarkdown } from 'discord.js';

export default {
    name: 'chat:memberKick',
    runOnce: false,
    run: async (
        bridge,
        rank: string | undefined,
        playerName: string,
        kickerRank: string | undefined,
        kickerName: string
    ) => {
        await bridge.discord.send(
            'gc',
            `${emojis.negativeEvent} **${rank ? `${rank} ` : ''}${escapeMarkdown(
                playerName
            )}** was kicked by **${kickerRank ? `${kickerRank} ` : ''}${escapeMarkdown(
                kickerName
            )}**`,
            undefined,
            true
        );
    },
} as BotEvent;
