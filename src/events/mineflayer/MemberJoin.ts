import { Util } from "discord.js";
import { Event } from "../../interfaces/Event";
import Emojis from "../../util/Emojis";

export default {
	name: "chat:memberJoin",
	runOnce: false,
	run: async (bot, message) => {
		const messageArray: string[] = message.toString().split(",");

		const hypixelRank = messageArray[0] as string | null;
		const playerName = messageArray[1] as string;

		await bot.sendToDiscord(
			"gc",
			`${Emojis.guildEvent} ${hypixelRank ?? ""}${Util.escapeMarkdown(playerName)} joined the guild!`,
		);
	},
} as Event;
