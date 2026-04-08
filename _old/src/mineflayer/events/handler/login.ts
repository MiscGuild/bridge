import emojis from '../../../util/emojis';
import env from '../../../util/env';

export default {
    name: 'login',
    runOnce: true,
    run: async (bridge) => {
        bridge.mineflayer.reconnecting = false;

        await bridge.discord.send(
            'gc',
            `${emojis.success} **The bot has logged in and is now ready!**`
        );

        if (env.REMINDER_ENABLED) {
            setInterval(
                () => {
                    bridge.mineflayer.chat('gc', env.REMINDER_MESSAGE);
                },
                1000 * 60 * env.REMINDER_FREQUENCY
            );
        }

        setInterval(
            () => {
                bridge.mineflayer.execute('/g online');
            },
            1000 * 60 * 5
        );

        setTimeout(() => {
            bridge.mineflayer.execute('/g online');
            bridge.mineflayer.sendToLimbo();
        }, 1000 * 3);
    },
} as BotEvent;
