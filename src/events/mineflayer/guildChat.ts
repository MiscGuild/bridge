import { Util } from "discord.js";
import { ChatMessage } from "prismarine-chat";
import { Event } from "../../interfaces/Event";
import Emojis from "../../util/emojis";

export default {
	name: "chat:guildChat",
	runOnce: false,
	run: async (bot, message: ChatMessage) => {
		const messageArray = message.toString().split(",");

		const channel = messageArray[0] as "Guild" | "Officer";
		const hypixelRank = messageArray[1] as string | null;
		const playerName = messageArray[2] as string;
		const guildRank = messageArray[3] as string | null;
		const chatMessage = messageArray[4] as string;

		const formattedMessage = ` **${hypixelRank ?? ""}${Util.escapeMarkdown(playerName)}${
			" " + guildRank ?? ""
		}:** ${Util.escapeMarkdown(chatMessage)}`;
		channel === "Guild"
			? await bot.sendToDiscord("gc", Emojis.member + formattedMessage)
			: await bot.sendToDiscord("oc", Emojis.officer + formattedMessage);
	},
} as Event;
