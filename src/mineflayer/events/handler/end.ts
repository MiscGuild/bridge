import winston from 'winston';

export default {
    name: 'end',
    runOnce: false,
    run: (_bridge, reason: string) => {
        winston.error(`The bot session has abruptly ended: ${reason}`);

        process.exit(1);
    },
} as BotEvent;
