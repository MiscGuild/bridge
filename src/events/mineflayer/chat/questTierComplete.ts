import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:questTierComplete",
	runOnce: false,
	run: async (bot, completedTier: number) => {
		return await bot.sendToDiscord(
			"gc",
			`${Emojis.guildEvent} The guild has completed Tier ${completedTier} of this week's Guild Quest!`,
			"#36393F",
		);
	},
} as Event;
