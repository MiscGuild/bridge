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
		const content = ` **${await getRankEmojis(hypixelRank)}${Util.escapeMarkdown(playerName)}${
			" " + guildRank ?? ""
		}:** ${Util.escapeMarkdown(message)}`;

		bot.sendToDiscord(channel === "Guild" ? "gc" : "oc", content, undefined, true);
	},
} as Event;
