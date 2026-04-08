import consola from 'consola';
import emojis from '../../../util/emojis';

export default {
    name: 'kicked',
    runOnce: false,
    run: async (bridge, reason: string, loggedIn: boolean) => {
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
                message = 'Hypixel currently being in maintenance mode';
                break;

            default:
                message = 'an unknown reason';
                break;
        }

        await bridge.discord.send(
            'gc',
            `${emojis.error} The bot was kicked from the server due to ${message}`
        );

        consola.error(
            `The bot was kicked from the server.\nReason: ${reason}\nLogged in: ${loggedIn}`
        );

        bridge.mineflayer.reconnectOrExit(bridge);
    },
} as BotEvent;
