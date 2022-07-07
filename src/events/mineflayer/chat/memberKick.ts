import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";
import { Util } from "discord.js";
import { HypixelRank } from "../../../interfaces/Ranks";

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
		await bot.sendToDiscord(
			"gc",
			`${Emojis.badGuildEvent} ${hypixelRank ?? ""} ${Util.escapeMarkdown(playerName)} was kicked by ${
				kickedByHypixelRank + " " ?? ""
			}${Util.escapeMarkdown(kickedByPlayerName)}`,
			undefined,
			true,
		);
	},
} as Event;
