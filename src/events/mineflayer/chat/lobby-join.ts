export default {
    name: 'chat:lobbyJoin',
    runOnce: false,
    run: (bot) => {
        bot.sendToLimbo();
    },
} as Event;
