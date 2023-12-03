import { Event } from "../../../interfaces/Event";

export default {
	name: "message",
	runOnce: false,
	run: (bot, message) => {
		// Log color chat to console
		bot.logger.log(message.toAnsi());
	},
} as Event;
