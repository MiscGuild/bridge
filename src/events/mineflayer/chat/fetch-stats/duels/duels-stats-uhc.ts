// This is a work in progress and is not yet functional.

function getRandomHexColor(): string {
    return `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0')}`;
}

export default {
    name: 'chat:duels-uhc',
    runOnce: false,
    run: async (
        bot,
        channel: string,
        playerRank: string,
        playerName: string,
        guildRank: string,
        target: string
    ) => {
        const _channel = channel;
        const _playerRank = playerRank;
        const _playerName = playerName;
        const _guildRank = guildRank;
        const _target = target;

        bot.executeCommand(
            `/gc ${playerName}, I'm sorry but this command is not available yet. | ${getRandomHexColor()}`
        );
    },
} as Event;
