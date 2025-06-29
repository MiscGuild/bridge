import getRandomHexColor from '../../../util/getRandomHexColor';

export function handleSameMessageTwice(bot: any, message: string): void {
    if (message.includes(`You cannot say the same message twice!`)) {
        return bot.executeCommand(
            `/gc Please try a different message or command! Or try it later :cute: | ${getRandomHexColor()}`
        );
    }
}

export default {
    name: 'chat:sameMessageTwice',
    runOnce: false,
    run: async (bot, message: string) => {
        await handleSameMessageTwice(bot, message);
    },
} as Event;
