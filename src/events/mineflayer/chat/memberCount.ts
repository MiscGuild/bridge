import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:memberCount",
	runOnce: false,
	run: async (bot, type: "Online" | "Total", count: number) => {
		if (type === "Online") {
			bot.onlineCount = count;
		} else {
			bot.totalCount = count;
		}

		await bot.setStatus();
	},
} as Event;
