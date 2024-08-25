import logger from 'consola';

export default {
    name: 'chat:joinLimbo',
    runOnce: false,
    run: (bot) => {
        logger.info('Bot has joined Limbo!');
        bot.limboTries = 0;
    },
} as Event;
