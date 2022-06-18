import { ChatMessage } from "prismarine-chat";
import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";
import { Util } from "discord.js";

export default {
	name: "chat:promotedDemoted",
	runOnce: false,
	run: async (bot, message: ChatMessage) => {
		const messageArray = message.toString().split(",");

		const hypixelRank = messageArray[0] as string | null;
		const playerName = messageArray[1] as string;
		const changeType = messageArray[2] as "promoted" | "demoted";
		const guildRankFrom = messageArray[3] as string;
		const guildRankTo = messageArray[4] as string;

		await bot.sendToDiscord(
			"gc",
			`${Emojis.guildEvent} ${hypixelRank ?? ""}${Util.escapeMarkdown(
				playerName,
			)} was ${changeType} to ${guildRankTo} from ${guildRankFrom}!`,
		);
	},
} as Event;
