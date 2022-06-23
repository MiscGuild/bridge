import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";
import { Util } from "discord.js";

export default {
	name: "chat:memberKicked",
	runOnce: false,
	run: async (
		bot,
		hypixelRank: string | null,
		playerName: string,
		kickedByHypixelRank: string | null,
		kickedByPlayerName: string,
	) => {
		await bot.sendToDiscord(
			"gc",
			`${Emojis.badGuildEvent} ${hypixelRank ?? ""}${Util.escapeMarkdown(playerName)} was kicked by ${
				kickedByHypixelRank + " " ?? ""
			}${Util.escapeMarkdown(kickedByPlayerName)}`,
		);
	},
} as Event;
