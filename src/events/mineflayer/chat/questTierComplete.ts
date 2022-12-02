import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:questTierComplete",
	runOnce: false,
	run: async (bot, completedTier: number) => {
		await bot.sendToDiscord(
			"gc",
			`${Emojis.positiveGuildEvent} The guild has completed Tier **${completedTier}** of this week's Guild Quest!`,
			0x36393f,
			true,
		);
	},
} as Event;
