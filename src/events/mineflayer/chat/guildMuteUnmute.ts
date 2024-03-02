import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";
import { escapeMarkdown } from "discord.js";

export default {
	name: "chat:guildMuteUnmute",
	runOnce: false,
	run: async (
		bot,
		authorRank: string | undefined,
		authorName: string,
		type: "muted" | "unmuted",
		victimRank: string | undefined,
		victimName: string,
		duration: string | undefined,
	) => {
		const content = `${type === "unmuted" ? Emojis.positiveGuildEvent : Emojis.negativeGuildEvent} **${
			authorRank ? authorRank + " " : ""
		}${escapeMarkdown(authorName)}** has ${type} **${victimRank ? victimRank + " " : ""}${escapeMarkdown(
			victimName,
		)}**${duration ? ` for ${duration}` : ""}`;

		await bot.sendToDiscord("gc", content, undefined, true);
	},
} as Event;
