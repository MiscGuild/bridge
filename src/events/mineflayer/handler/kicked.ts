import Emojis from '@util/emojis';

export default {
    name: 'kicked',
    runOnce: false,
    run: async (bot, reasonData: string | any, loggedIn: boolean) => {
        // If the client is disconnected by a communication/protocol error, the reason will be an object
        // The structure of the object might be dynamic, should be checked later
        let reason: string;
        if (typeof reasonData === 'object') {
            [reason] = reasonData.value.extra.value.value;
        } else {
            reason = reasonData;
        }
        let message: string;
        switch (true) {
            // Proxy reboot
            case reason.includes('This proxy is being rebooted.'):
                message = 'a proxy reboot';
                break;

            // Duplicate Login
            case reason.includes('You logged in from another location!'):
                message = 'a duplicate login';
                break;

            // Authentication error
            case reason.includes('Failed to authenticate your connection!'):
                message = 'an authentication error';
                break;

            // Invalid packets
            case reason.includes('Why do you send us invalid packets?'):
                message = 'it sending invalid packets';
                break;

            // Maintenance
            case reason.includes('This server is currently in maintenance mode') ||
                reason.includes('is currently down for maintenance'):
                message = 'hypixel currently being in maintenance mode';
                break;

            default:
                message = 'an unkown reason';
                break;
        }

        await bot.sendToDiscord(
            'gc',
            `${Emojis.error} The bot was kicked from the server due to ${message}. Restarting the bot in 15 seconds...`
        );

        bot.logger.error(
            `The bot was kicked from the server. Restarting the bot in 15 seconds...\nReason: ${reason}\nLogged in: ${loggedIn}`
        );

        setTimeout(() => {
            process.exit(1);
        }, 15_000);
    },
} as Event;
