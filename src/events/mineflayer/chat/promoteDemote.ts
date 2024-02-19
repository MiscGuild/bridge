import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";
import { HypixelRank } from "../../../interfaces/Ranks";
import { escapeMarkdown } from "discord.js";
import getRankData from "../../../util/emojis/getRankData";

export default {
	name: "chat:promoteDemote",
	runOnce: false,
	run: async (
		bot,
		hypixelRank: HypixelRank | undefined,
		playerName: string,
		type: "promoted" | "demoted",
		guildRankFrom: string,
		guildRankTo: string,
	) => {
		const [rank, color] = await getRankData(hypixelRank);

		await bot.sendToDiscord(
			"gc",
			`${type === "promoted" ? Emojis.positiveGuildEvent : Emojis.negativeGuildEvent} **${
				rank ? rank + " " : ""
			}${escapeMarkdown(playerName)}** was ${type} to ${guildRankTo} from ${guildRankFrom}!`,
			color,
			true,
		);
	},
} as Event;
