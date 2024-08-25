import logger from 'consola';

export default {
    name: 'end',
    runOnce: false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    run: (bot) => {
        logger.fatal('The bot session has abruptly ended. Restarting the bot in 15 seconds...');

        setTimeout(() => {
            process.exit(1);
        }, 15_000);
    },
} as Event;
