import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";
import { HypixelRank } from "../../../interfaces/Ranks";
import { Util } from "discord.js";
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
		const [rank] = await getRankData(byHypixelRank);
		const [byRank] = await getRankData(hypixelRank);

		const content = `${type === "unmuted" ? Emojis.guildEvent : Emojis.badGuildEvent} **${
			rank ? rank + " " : ""
		}${Util.escapeMarkdown(byPlayerName)}** was ${type} by **${byRank ? byRank + " " : ""}${Util.escapeMarkdown(
			playerName,
		)}**${duration ? ` for ${duration}` : ""}`;

		await bot.sendToDiscord("gc", content, undefined, true);
	},
} as Event;
