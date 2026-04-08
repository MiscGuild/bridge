import emojis from '../../../util/emojis';

export default {
    name: 'chat:questTierComplete',
    runOnce: false,
    run: async (bridge, completedTier: number) => {
        await bridge.discord.send(
            'gc',
            `${emojis.positiveEvent} The guild has completed Tier **${completedTier}** of this week's Guild Quest!`,
            0x36393f,
            true
        );
    },
} as BotEvent;
