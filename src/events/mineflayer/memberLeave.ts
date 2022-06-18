import { ChatMessage } from "prismarine-chat";
import Emojis from "../../util/emojis";
import { Event } from "../../interfaces/Event";
import { Util } from "discord.js";

export default {
	name: "chat:memberLeave",
	runOnce: false,
	run: async (bot, message: ChatMessage) => {
		const messageArray = message.toString().split(",");

		const hypixelRank = messageArray[0] as string | null;
		const playerName = messageArray[1] as string;

		await bot.sendToDiscord(
			"gc",
			`${Emojis.badGuildEvent} ${hypixelRank ?? ""}${Util.escapeMarkdown(playerName)} left the guild!`,
		);
	},
} as Event;
