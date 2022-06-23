import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";
import { Util } from "discord.js";

export default {
	name: "chat:guildChat",
	runOnce: false,
	run: async (
		bot,
		channel: "Guild" | "Officer",
		hypixelRank: string | null,
		playerName: string,
		guildRank: string | null,
		message: string,
	) => {
		const formattedMessage = ` **${hypixelRank ?? ""}${Util.escapeMarkdown(playerName)}${
			" " + guildRank ?? ""
		}:** ${Util.escapeMarkdown(message)}`;
		channel === "Guild"
			? await bot.sendToDiscord("gc", Emojis.member + formattedMessage)
			: await bot.sendToDiscord("oc", Emojis.officer + formattedMessage);
	},
} as Event;
