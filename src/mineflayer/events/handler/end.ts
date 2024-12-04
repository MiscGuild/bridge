import winston from 'winston';

export default {
    name: 'end',
    runOnce: false,
    run: (bridge, reason: string) => {
        winston.error(`The bot session has abruptly ended: ${reason}`);
        bridge.mineflayer.reconnectOrExit(bridge);
    },
} as BotEvent;
