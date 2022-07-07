import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";
import { Util } from "discord.js";
import { HypixelRank } from "../../../interfaces/Ranks";
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
		const [rank, _color] = await getRankData(hypixelRank);
		const [kickedByRank, _kickedByColor] = await getRankData(kickedByHypixelRank);

		await bot.sendToDiscord(
			"gc",
			`${Emojis.badGuildEvent} ${rank ? rank + " " : ""}${Util.escapeMarkdown(playerName)} was kicked by ${
				kickedByRank ? kickedByRank + " " : ""
			}${Util.escapeMarkdown(kickedByPlayerName)}`,
			undefined,
			true,
		);
	},
} as Event;
