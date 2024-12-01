import winston from 'winston';

export default {
    name: 'error',
    runOnce: false,
    run: (bot, error: Error) => {
        winston.error('Encountered an unexpected error. Restarting the bot in 15 seconds...');
        winston.error(error);

        setTimeout(() => {
            process.exit(1);
        }, 15_000);
    },
} as Event;
