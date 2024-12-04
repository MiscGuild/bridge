import winston from 'winston';

export default {
    name: 'chat:joinLimbo',
    runOnce: false,
    run: (bridge) => {
        bridge.mineflayer.limboAttempts = 0;
        winston.info('Bot has joined Limbo!');
    },
} as BotEvent;
