import { ChatMessage } from "prismarine-chat";
import { Event } from "../../../interfaces/Event";

export default {
	name: "message",
	runOnce: false,
	run: (bot, message: ChatMessage) => {
		// Log color chat to console
		bot.logger.log(message.toAnsi());
	},
} as Event;
