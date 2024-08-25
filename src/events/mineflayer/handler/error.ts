import logger from 'consola';

export default {
    name: 'error',
    runOnce: false,
    run: (bot, error: Error) => {
        logger.fatal('Encountered an unexpected error. Restarting the bot in 15 seconds...');
        logger.fatal(error);

        setTimeout(() => {
            process.exit(1);
        }, 15_000);
    },
} as Event;
