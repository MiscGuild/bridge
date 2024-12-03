import winston from 'winston';

export default {
    name: 'error',
    runOnce: false,
    run: (_bridge, error: Error) => {
        winston.error('Encountered an unexpected error:', error);

        process.exit(1);
    },
} as BotEvent;
