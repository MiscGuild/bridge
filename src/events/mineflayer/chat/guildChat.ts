import { Event } from "../../../interfaces/Event";
import { HypixelRank } from "../../../interfaces/Ranks";
import { Util } from "discord.js";
import getRankEmojis from "../../../util/emojis/getRankEmojis";

export default {
	name: "chat:guildChat",
	runOnce: false,
	run: async (
		bot,
		channel: "Guild" | "Officer",
		hypixelRank: HypixelRank | undefined,
		playerName: string,
		guildRank: string | undefined,
		message: string,
	) => {
		const formattedMessage = ` **${await getRankEmojis(hypixelRank)}${Util.escapeMarkdown(playerName)}${
			" " + guildRank ?? ""
		}:** ${Util.escapeMarkdown(message)}`;

		await bot.sendToDiscord(channel === "Guild" ? "gc" : "oc", formattedMessage)
	},
} as Event;
