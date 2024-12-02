import winston from 'winston';

export default {
    name: 'end',
    runOnce: false,
    run: (_bot) => {
        winston.error('The bot session has abruptly ended. Exiting in 15 seconds...');

        setTimeout(() => {
            process.exit(1);
        }, 15_000);
    },
} as Event;
