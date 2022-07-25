import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:memberCount",
	runOnce: false,
	run: (bot, type: "Online" | "Total", count: number) => {
		if (type === "Online") {
			bot.onlineCount = count;
		} else {
			bot.totalCount = count;
		}

		bot.setStatus();
	},
} as Event;
