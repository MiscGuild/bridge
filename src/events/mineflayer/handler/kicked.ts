import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";

export default {
	name: "kicked",
	runOnce: false,
	run: async (bot, reason: string, loggedIn: boolean) => {
		let message: string;
		switch (true) {
			// Proxy reboot
			case reason.includes("This proxy is being rebooted."):
				message = "a proxy reboot";
				break;

			// Duplicate Login
			case reason.includes("You logged in from another location!"):
				message = "a duplicate login";
				break;

			// Authentication error
			case reason.includes("Failed to authenticate your connection!"):
				message = "an authentication error";
				break;

			// Invalid packets
			case reason.includes("Why do you send us invalid packets?"):
				message = "it sending invalid packets";
				break;

			// Maintenance
			case reason.includes("This server is currently in maintenance mode") ||
				reason.includes("is currently down for maintenance"):
				message = "hypixel currently being in maintenance mode";
				break;

			default:
				message = "an unkown reason";
				break;
		}

		await bot.sendToDiscord(
			"gc",
			`${Emojis.error} The bot was kicked from the server due to ${message}. Restarting the bot in 15 seconds...`,
		);

		bot.logger.error(
			`The bot was kicked from the server. Restarting the bot in 15 seconds...\nReason: ${reason}\nLogged in: ${loggedIn}`,
		);

		setTimeout(() => {
			process.exit(1);
		}, 15_000);
	},
} as Event;
