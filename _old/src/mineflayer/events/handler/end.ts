import consola from 'consola';

export default {
    name: 'end',
    runOnce: false,
    run: (bridge, reason: string) => {
        consola.error(`The bot session has abruptly ended: ${reason}`);
        bridge.mineflayer.reconnectOrExit(bridge);
    },
} as BotEvent;
