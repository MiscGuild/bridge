//This script is a work in progress and is not yet functional. It is intended to be used to fetch guild logs from the chat.

export default {
    name: 'chat:guildLog',
    runOnce: false,
    run: async (bot, ...fullMatches) => {
        console.log(`[DEBUG] A guild log event has been triggered!`);

        const _fullMatch = fullMatches.filter((match) => match !== undefined).join('\n');

        console.log(`[DEBUG] Full Match: ${_fullMatch}`);
    },
} as Event;
