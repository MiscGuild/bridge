export default {
    name: 'chat:sameMessageTwice',
    runOnce: false,
    run: async (bridge) => {
        await bridge.discord.send('gc', '`You cannot say the same message twice!`', 0x36393f);
    },
} as BotEvent;
