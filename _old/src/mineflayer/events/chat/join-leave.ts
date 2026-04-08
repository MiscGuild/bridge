import emojis from '../../../util/emojis';
import { escapeMarkdown } from 'discord.js';

export default {
    name: 'chat:joinLeave',
    runOnce: false,
    run: async (bridge, playerName: string, status: 'joined' | 'left') => {
        const emoji = status === 'joined' ? emojis.join : emojis.leave;
        if (status === 'joined') {
            bridge.onlineCount += 1;
        } else {
            bridge.onlineCount -= 1;
        }
        bridge.setStatus();

        await bridge.discord.send(
            'gc',
            `${emoji} **${escapeMarkdown(playerName)}** ${status}. \`(${bridge.onlineCount}/${
                bridge.totalCount
            })\``
        );
    },
} as BotEvent;
