import winston from 'winston';

export default {
    name: 'error',
    runOnce: false,
    run: (_bot, error: Error) => {
        winston.error('Encountered an unexpected error. Exiting in 15 seconds...', error);

        setTimeout(() => {
            process.exit(1);
        }, 15_000);
    },
} as Event;
