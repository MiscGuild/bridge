import Emojis from '@util/emojis';

export default {
    name: 'login',
    runOnce: true,
    run: async (bot) => {
        await bot.sendToDiscord(
            'gc',
            `${Emojis.success} **\`${bot.mineflayer.username}\` has logged in and is now ready!**`
        );

        if (process.env.REMINDER_ENABLED === 'true') {
            const frequency = parseInt(process.env.REMINDER_FREQUENCY, 10);

            setInterval(() => {
                bot.sendGuildMessage('gc', process.env.REMINDER_MESSAGE);
            }, 1000 * 60 * (Number.isNaN(frequency) ? 60 : frequency));
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
