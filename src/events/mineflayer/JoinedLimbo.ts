import { Event } from "../../interfaces/Event";

export default {
	name: "chat:limboJoin",
	runOnce: false,
	run: async (bot) => {
		bot.logger.debug("Bot has joined Limbo!");
	},
} as Event;
