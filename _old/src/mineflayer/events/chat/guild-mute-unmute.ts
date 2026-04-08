import emojis from '../../../util/emojis';
import { escapeMarkdown } from 'discord.js';

export default {
    name: 'chat:guildMuteUnmute',
    runOnce: false,
    run: async (
        bridge,
        authorRank: string | undefined,
        authorName: string,
        type: 'muted' | 'unmuted',
        victimRank: string | undefined,
        victimName: string,
        duration: string | undefined
    ) => {
        const content = `${type === 'unmuted' ? emojis.positiveEvent : emojis.negativeEvent} **${
            authorRank ? `${authorRank} ` : ''
        }${escapeMarkdown(authorName)}** has ${type} **${
            victimRank ? `${victimRank} ` : ''
        }${escapeMarkdown(victimName)}**${duration ? ` for ${duration}` : ''}`;

        await bridge.discord.send('gc', content, undefined, true);
    },
} as BotEvent;
