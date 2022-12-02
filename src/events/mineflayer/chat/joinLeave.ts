import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";
import { escapeMarkdown } from "discord.js";

export default {
	name: "chat:joinLeave",
	runOnce: false,
	run: async (bot, playerName: string, status: "joined" | "left") => {
		const emoji = status === "joined" ? Emojis.join : Emojis.leave;
		status === "joined" ? bot.onlineCount++ : bot.onlineCount--;

		await bot.sendToDiscord(
			"gc",
			`${emoji} **${escapeMarkdown(playerName)}** ${status}. \`(${bot.onlineCount}/${bot.totalCount})\``,
		);
	},
} as Event;
