import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:lobbyJoin",
	runOnce: false,
	run: (bot) => {
		bot.logger.warn("Detected that the bot is not in Limbo, sending to limbo.");
		bot.sendToLimbo();
	},
} as Event;
