import consola from 'consola';

export default {
    name: 'error',
    runOnce: false,
    run: (bridge, error: Error) => {
        consola.error('Encountered an unexpected error:', error);
        bridge.mineflayer.reconnectOrExit(bridge);
    },
} as BotEvent;
