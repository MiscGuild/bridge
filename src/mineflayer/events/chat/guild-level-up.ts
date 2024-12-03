export default {
    name: 'chat:guildLevelUp',
    runOnce: false,
    run: async (bridge, guildLevel: number) => {
        await bridge.discord.send(
            'gc',
            `The guild has leveled up to level **${guildLevel}**!`,
            0x00aa00,
            true
        );
    },
} as BotEvent;
