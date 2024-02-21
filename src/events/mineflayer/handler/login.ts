import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";

export default {
	name: "login",
	runOnce: true,
	run: async (bot) => {
		await bot.sendToDiscord(
			"gc",
			`${Emojis.success} **\`${bot.mineflayer.username}\` has logged in and is now ready!**`,
		);

		if (process.env.REMINDER_ENABLED === "true") {
			const frequency = parseInt(process.env.REMINDER_FREQUENCY, 10);

			setInterval(() => {
				bot.sendGuildMessage("gc", process.env.REMINDER_MESSAGE);
			}, 1000 * 60 * (isNaN(frequency) ? 60 : frequency));
		}

		setTimeout(async () => {
			bot.executeCommand("/g online");
			bot.sendToLimbo();
		}, 1000 * 3);
	},
} as Event;
