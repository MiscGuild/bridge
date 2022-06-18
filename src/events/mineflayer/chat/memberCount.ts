import { ChatMessage } from "prismarine-chat";
import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:memberCount",
	runOnce: false,
	run: async (bot, message: ChatMessage) => {
		const messageArray = message.toString().split(",");

		const type = messageArray[0] as "Online" | "Total";
		const count = Number(messageArray[1]) as number;

		// Set the online members count
		if (type === "Online") {
			bot.onlineCount = count;
		}

		// Set the total members count
		if (type === "Total") {
			bot.totalCount = count;
		}

		await bot.setStatus();
	},
} as Event;
