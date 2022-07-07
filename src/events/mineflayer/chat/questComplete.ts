import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:questComplete",
	runOnce: false,
	run: async (bot) => {
		return await bot.sendToDiscord(
			"gc",
			`${Emojis.guildEvent} The guild has completed this week's Guild Quest!`,
			0xFFAA00,
		);
	},
} as Event;
