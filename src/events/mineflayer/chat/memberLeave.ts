import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";
import { Util } from "discord.js";

export default {
	name: "chat:memberLeave",
	runOnce: false,
	run: async (bot, hypixelRank: string | undefined, playerName: string) => {
		await bot.sendToDiscord(
			"gc",
			`${Emojis.badGuildEvent} ${hypixelRank ?? ""}${Util.escapeMarkdown(playerName)} left the guild!`,
			undefined,
			true,
		);
	},
} as Event;
