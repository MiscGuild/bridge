import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:joinLimbo",
	runOnce: false,
	run: (bot) => {
		bot.logger.info("Bot has joined Limbo!");
	},
} as Event;
