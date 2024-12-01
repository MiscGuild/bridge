import winston from 'winston';
import Emojis from '@util/emojis';

export default {
    name: 'chat:commentBlocked',
    runOnce: false,
    run: async (bot, comment: string, reason: string) => {
        winston.warn(`Comment blocked by Hypixel: ${comment} (${reason})`);
        await bot.sendToDiscord(
            'oc',
            `${Emojis.alert} "${comment}" was blocked by Hypixel because **${reason}**. Developers will not take responsibility for banned accounts.`
        );
    },
} as Event;
