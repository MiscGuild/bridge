import { Event } from "../../interfaces/Event";
import Emojis from "../../util/emojis";
import { ChatMessage } from "prismarine-chat";

export default {
	name: "chat:commentBlocked",
	runOnce: false,
	run: async (bot, message: ChatMessage) => {
		const messageArray = message.toString().split(",");

		const comment = messageArray[0] as string;
		const reason = messageArray[1] as string;

		bot.logger.warn(`Comment blocked by Hypixel: ${comment} (${reason})`);
		bot.sendToDiscord(
			"oc",
			`${Emojis.alert} "${comment}" was blocked by Hypixel because **${reason}**. Developers will not take responsibility for banned accounts.`,
		);
	},
} as Event;
