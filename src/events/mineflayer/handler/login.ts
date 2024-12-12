import Emojis from '../../../util/emojis';
import env from '../../../util/env';

export default {
    name: 'login',
    runOnce: true,
    run: async (bot) => {
        await bot.sendToDiscord(
            'gc',
            `${Emojis.success} **\`${bot.mineflayer.username}\` has logged in and is now ready!**`
        );

        if (env.REMINDER_ENABLED) {
            setInterval(() => {
                bot.sendGuildMessage('gc', env.REMINDER_MESSAGE);
            }, 1000 * 60 * env.REMINDER_FREQUENCY);
        }

        setInterval(() => {
            bot.executeCommand('/g online');
        }, 1000 * 60 * 5);

        setTimeout(() => {
            bot.executeCommand('/g online');
            bot.sendToLimbo();
        }, 1000 * 3);
    },
} as Event;
