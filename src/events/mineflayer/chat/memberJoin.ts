import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";
import { Util } from "discord.js";

export default {
	name: "chat:memberJoin",
	runOnce: false,
	run: async (bot, hypixelRank: string | undefined, playerName: string) => {
		await bot.sendToDiscord(
			"gc",
			`${Emojis.guildEvent} ${hypixelRank ?? ""}${Util.escapeMarkdown(playerName)} joined the guild!`,
			undefined,
			true,
		);
	},
} as Event;
