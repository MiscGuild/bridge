import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";
import { HypixelRank } from "../../../interfaces/Ranks";
import { escapeMarkdown } from "discord.js";
import getRankData from "../../../util/emojis/getRankData";

export default {
	name: "chat:memberKick",
	runOnce: false,
	run: async (
		bot,
		hypixelRank: HypixelRank | undefined,
		playerName: string,
		kickedByHypixelRank: HypixelRank | undefined,
		kickedByPlayerName: string,
	) => {
		const [[rank], [kickedByRank]] = await Promise.all([
			getRankData(hypixelRank),
			getRankData(kickedByHypixelRank),
		]);

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
