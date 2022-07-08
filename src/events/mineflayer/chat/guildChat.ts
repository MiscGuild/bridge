import { Event } from "../../../interfaces/Event";
import { HypixelRank } from "../../../interfaces/Ranks";
import { Util } from "discord.js";
import getRankData from "../../../util/emojis/getRankData";

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
		const [rank, color] = await getRankData(hypixelRank);
		const content = ` **${rank ? rank + " " : ""}${Util.escapeMarkdown(playerName)}${
			guildRank ? " " + guildRank : ""
		}:** ${Util.escapeMarkdown(message)}`;

		bot.sendToDiscord(channel === "Guild" ? "gc" : "oc", content, color);
	},
} as Event;
