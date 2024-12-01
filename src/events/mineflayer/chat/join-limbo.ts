import winston from 'winston';

export default {
    name: 'chat:joinLimbo',
    runOnce: false,
    run: (bot) => {
        winston.info('Bot has joined Limbo!');
        bot.limboTries = 0;
    },
} as Event;
