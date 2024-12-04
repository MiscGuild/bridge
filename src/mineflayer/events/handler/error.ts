import winston from 'winston';

export default {
    name: 'error',
    runOnce: false,
    run: (bridge, error: Error) => {
        winston.error('Encountered an unexpected error:', error);
        bridge.mineflayer.reconnectOrExit(bridge);
    },
} as BotEvent;
