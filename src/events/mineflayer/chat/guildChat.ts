import { Event } from "../../../interfaces/Event";
import { HypixelRank } from "../../../interfaces/Ranks";
import { MessageEmbed, Util } from "discord.js";
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
		const embed = new MessageEmbed().setDescription(
			` **${await getRankEmojis(hypixelRank)}${Util.escapeMarkdown(playerName)}${
				" " + guildRank ?? ""
			}:** ${Util.escapeMarkdown(message)}`,
		);

		bot.sendEmbed(channel === "Guild" ? "gc" : "oc", [embed]);
	},
} as Event;
