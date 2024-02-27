import { Event } from "../../../interfaces/Event";

export default {
	name: "error",
	runOnce: false,
	run: (bot, error: Error) => {
		bot.logger.fatal("Encountered an unexpected error. Restarting the bot in 15 seconds...");
		bot.logger.fatal(error);

		setTimeout(() => {
			process.exit(1);
		}, 15_000);
	},
} as Event;
