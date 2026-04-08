import consola from 'consola';

export default {
    name: 'chat:joinLimbo',
    runOnce: false,
    run: (bridge) => {
        bridge.mineflayer.limboAttempts = 0;
        consola.info('Bot has joined Limbo!');
    },
} as BotEvent;
