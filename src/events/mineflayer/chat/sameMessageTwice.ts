import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:sameMessageTwice",
	runOnce: false,
	run: async (bot) => {
		await bot.sendToDiscord("gc", "`You cannot say the same message twice!`", 0x36393f);
	},
} as Event;
