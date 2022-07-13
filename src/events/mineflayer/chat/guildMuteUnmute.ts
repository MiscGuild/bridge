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
		hypixelRank: HypixelRank | undefined,
		playerName: string,
		type: "muted" | "unmuted",
		byHypixelRank: HypixelRank | undefined,
		byPlayerName: string,
		duration: string | undefined,
	) => {
		const [rank] = await getRankData(hypixelRank);
		const [byRank] = await getRankData(byHypixelRank);

		const content = `${Emojis.badGuildEvent} **${rank ? rank + " " : ""}${Util.escapeMarkdown(
			playerName,
		)}** was ${type} by **${byRank ? byRank + " " : ""}${Util.escapeMarkdown(byPlayerName)}**${
			duration ? ` for ${duration}` : ""
		}`;

		await bot.sendToDiscord("gc", content, undefined, true);
	},
} as Event;
