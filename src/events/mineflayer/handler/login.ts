import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";

export default {
	name: "login",
	runOnce: true,
	run: async (bot) => {
		await bot.sendToDiscord(
			"gc",
			`${Emojis.success} **The bot \`${bot.mineflayer.username}\` has logged in and is now ready!**`,
		);

		setInterval(() => {
			bot.executeCommand("/g online");
		}, 60_000 * 5);

		setTimeout(async () => {
			bot.executeCommand("/g online");
			await bot.sendToLimbo();
		}, 3_000);

		setInterval(() => {
			bot.sendGuildMessage(
				"gc",
				"Register for the Guild Experience Tournament by doing '/w MiscBot register' or by creating a ticket in our discord for your chance to win awesome prizes!",
			);
		}, 60_000 * 30);
	},
} as Event;
