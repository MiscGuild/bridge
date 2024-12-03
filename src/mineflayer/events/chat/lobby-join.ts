export default {
    name: 'chat:lobbyJoin',
    runOnce: false,
    run: (bridge) => {
        bridge.mineflayer.sendToLimbo();
    },
} as BotEvent;
