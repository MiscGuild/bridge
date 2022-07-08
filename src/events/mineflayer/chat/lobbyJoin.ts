import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:lobbyJoin",
	runOnce: false,
	run: async (bot) => {
		bot.logger.warn("Detected that the bot is not in Limbo, sending to limbo.");
		await bot.sendToLimbo();
	},
} as Event;
