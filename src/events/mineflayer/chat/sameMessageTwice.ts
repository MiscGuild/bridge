import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:sameMessageTwice",
	runOnce: false,
	run: async (bot) => {
		return await bot.sendToDiscord("gc", "`You cannot say the same message twice!`", 0x36393F);
	},
} as Event;
