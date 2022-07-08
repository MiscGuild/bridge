import { Event } from "../../../interfaces/Event";

export default {
	name: "end",
	runOnce: false,
	run: async (bot) => {
		bot.logger.fatal("The bot session has abruptly ended. Restarting the bot in 15 seconds...");

		setTimeout(() => {
			process.exit(1);
		}, 15_000);
	},
} as Event;
