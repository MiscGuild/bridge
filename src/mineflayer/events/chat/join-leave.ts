import emojis from '@util/emojis';
import { escapeMarkdown } from 'discord.js';

export default {
    name: 'chat:joinLeave',
    runOnce: false,
    run: async (bridge, playerName: string, status: 'joined' | 'left') => {
        const emoji = status === 'joined' ? emojis.join : emojis.leave;
        bridge.onlineCount = status === 'joined' ? bridge.onlineCount++ : bridge.onlineCount--;

        await bridge.discord.send(
            'gc',
            `${emoji} **${escapeMarkdown(playerName)}** ${status}. \`(${bridge.onlineCount}/${
                bridge.totalCount
            })\``
        );
    },
} as BotEvent;
