import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";
import { escapeMarkdown } from "discord.js";

export default {
	name: "chat:memberKick",
	runOnce: false,
	run: async (
		bot,
		rank: string | undefined,
		playerName: string,
		kickedByRank: string | undefined,
		kickedByPlayerName: string,
	) => {
		await bot.sendToDiscord(
			"gc",
			`${Emojis.negativeGuildEvent} **${rank ? rank + " " : ""}${escapeMarkdown(playerName)}** was kicked by **${
				kickedByRank ? kickedByRank + " " : ""
			}${escapeMarkdown(kickedByPlayerName)}**`,
			undefined,
			true,
		);
	},
} as Event;
