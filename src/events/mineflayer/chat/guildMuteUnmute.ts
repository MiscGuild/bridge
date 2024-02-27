import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";
import { HypixelRank } from "../../../interfaces/Ranks";
import { escapeMarkdown } from "discord.js";
import getRankData from "../../../util/emojis/getRankData";

export default {
	name: "chat:guildMuteUnmute",
	runOnce: false,
	run: async (
		bot,
		byHypixelRank: HypixelRank | undefined,
		byPlayerName: string,
		type: "muted" | "unmuted",
		hypixelRank: HypixelRank | undefined,
		playerName: string,
		duration: string | undefined,
	) => {
		const [[byRank], [rank]] = await Promise.all([getRankData(byHypixelRank), getRankData(hypixelRank)]);

		const content = `${type === "unmuted" ? Emojis.positiveGuildEvent : Emojis.negativeGuildEvent} **${
			byRank ? byRank + " " : ""
		}${escapeMarkdown(byPlayerName)}** has ${type} **${rank ? rank + " " : ""}${escapeMarkdown(playerName)}**${
			duration ? ` for ${duration}` : ""
		}`;

		await bot.sendToDiscord("gc", content, undefined, true);
	},
} as Event;
