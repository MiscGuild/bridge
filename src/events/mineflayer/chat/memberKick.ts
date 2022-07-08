import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";
import { HypixelRank } from "../../../interfaces/Ranks";
import { Util } from "discord.js";
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
		const rank = (await getRankData(hypixelRank))[0];
		const kickedByRank = (await getRankData(kickedByHypixelRank))[0];

		await bot.sendToDiscord(
			"gc",
			`${Emojis.badGuildEvent} **${rank ? rank + " " : ""}${Util.escapeMarkdown(playerName)}** was kicked by **${
				kickedByRank ? kickedByRank + " " : ""
			}${Util.escapeMarkdown(kickedByPlayerName)}**`,
			undefined,
			true,
		);
	},
} as Event;
