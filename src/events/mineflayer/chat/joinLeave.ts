import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";
import { Util } from "discord.js";

export default {
	name: "chat:joinLeave",
	runOnce: false,
	run: async (bot, playerName: string, status: "joined" | "left") => {
		if (status === "joined") {
			bot.onlineCount++;
			await bot.sendToDiscord(
				"gc",
				`${Emojis.join} ${Util.escapeMarkdown(playerName)} joined. (\`${bot.onlineCount}\`/\`${
					bot.totalCount
				}\`)`,
			);
		}

		if (status === "left") {
			bot.onlineCount--;
			await bot.sendToDiscord(
				"gc",
				`${Emojis.leave} ${Util.escapeMarkdown(playerName)} left. (\`${bot.onlineCount}\`/\`${
					bot.totalCount
				}\`)`,
			);
		}
	},
} as Event;
