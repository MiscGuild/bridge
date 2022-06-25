import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:joinLimbo",
	runOnce: false,
	run: async (bot) => {
		bot.logger.debug("Bot has joined Limbo!");
	},
} as Event;
