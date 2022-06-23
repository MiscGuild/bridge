import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:commentBlocked",
	runOnce: false,
	run: async (bot, comment: string, reason: string) => {
		bot.logger.warn(`Comment blocked by Hypixel: ${comment} (${reason})`);
		bot.sendToDiscord(
			"oc",
			`${Emojis.alert} "${comment}" was blocked by Hypixel because **${reason}**. Developers will not take responsibility for banned accounts.`,
		);
	},
} as Event;
