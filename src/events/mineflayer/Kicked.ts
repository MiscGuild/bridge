import { Event } from '../../interfaces/Event';
import Emojis from '../../util/Emojis';

export default {
	name: 'kicked',
	runOnce: false,
	run: async (bot, reason: string, loggedIn: boolean) => {
		// Proxy Reboot
		if (reason.includes('This proxy is being rebooted.')) {
			await bot.sendToDiscord(
				'gc',
				`${Emojis.error} The bot was kicked from the server due to a proxy reboot. Restarting the bot in 15 seconds...`,
			);
			// Duplicate Login
		} else if (reason.includes('You logged in from another location!')) {
			await bot.sendToDiscord(
				'gc',
				`${Emojis.error} The bot was kicked from the server due to a duplicate login. Restarting the bot in 15 seconds...`,
			);
			// Authentication Error
		} else if (reason.includes('Failed to authenticate your connection!')) {
			await bot.sendToDiscord(
				'gc',
				`${Emojis.error} The bot was kicked from the server because of an authentication error. Restarting the bot in 15 seconds...`,
			);

			// Rare Errors

			// Invalid Packets
		} else if (reason.includes('Why do you send us invalid packets?')) {
			await bot.sendToDiscord(
				'gc',
				`${Emojis.error} The bot was kicked from the server because it was sending invalid packets. The developers have been alerted of this problem. Restarting the bot in 15 seconds...`,
			);
			// Maintenance
		} else if (
			reason.includes(
				'This server is currently in maintenance mode' || reason.includes('is currently down for maintenance'),
			)
		) {
			await bot.sendToDiscord(
				'gc',
				`${Emojis.error} Hypixel is currently in maintenance mode. The bot will restart in 15 seconds. To stop duplicate error messages, turn this feature off via the dashboard or shut the bot down.`,
			);
			// Other Errors
		} else {
			await bot.sendToDiscord(
				'gc',
				`${Emojis.error} The bot was kicked from the server for an unknown reason. Restarting the bot in 15 seconds...`,
			);
		}

		bot.logger.error(
			`The bot was kicked from the server. Restarting the bot in 15 seconds...\nReason: ${reason}\nLogged in: ${loggedIn}`,
		);

		setTimeout(() => {
			process.exit(1);
		}, 15_000);
	},
} as Event;
