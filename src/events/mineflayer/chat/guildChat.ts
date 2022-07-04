import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";
import { HypixelRank } from "../../../interfaces/Ranks";
import { Util } from "discord.js";
import getHypixelRankEmoji from "../../../util/emojis/getHypixelRankEmojis";

export default {
	name: "chat:guildChat",
	runOnce: false,
	run: async (
		bot,
		channel: "Guild" | "Officer",
		hypixelRank: HypixelRank | null,
		playerName: string,
		guildRank: string | null,
		message: string,
	) => {
		const formattedMessage = `**${await getHypixelRankEmoji(hypixelRank)}${Util.escapeMarkdown(playerName)}${
			" " + guildRank ?? ""
		}:** ${Util.escapeMarkdown(message)}`;
		channel === "Guild"
			? await bot.sendToDiscord("gc", Emojis.member + formattedMessage)
			: await bot.sendToDiscord("oc", Emojis.officer + formattedMessage);
	},
} as Event;
