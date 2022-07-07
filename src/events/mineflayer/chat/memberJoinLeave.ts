import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";
import { HypixelRank } from "../../../interfaces/Ranks";
import { Util } from "discord.js";
import getRankData from "../../../util/emojis/getRankData";

export default {
	name: "chat:memberJoinLeave",
	runOnce: false,
	run: async (bot, hypixelRank: HypixelRank | undefined, playerName: string, type: "joined" | "left") => {
		const [emojis, color] = await getRankData(hypixelRank);

		await bot.sendToDiscord(
			"gc",
			`${Emojis.guildEvent} **${emojis} ${Util.escapeMarkdown(playerName)}** ${type} the guild!`,
			color,
			true,
		);
	},
} as Event;
