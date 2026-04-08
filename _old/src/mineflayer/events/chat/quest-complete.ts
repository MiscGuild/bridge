import emojis from '../../../util/emojis';

export default {
    name: 'chat:questComplete',
    runOnce: false,
    run: async (bridge) => {
        await bridge.discord.send(
            'gc',
            `${emojis.positiveEvent} The guild has completed this week's Guild Quest!`,
            0xffaa00,
            true
        );
    },
} as BotEvent;
