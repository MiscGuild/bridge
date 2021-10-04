import { client, bot, sendToDiscord } from "../../index.js";
import { channelID } from "../../resources/consts.js";
import cron from "node-cron";
import log4js from "log4js";
const logger = log4js.getLogger("Logs");

export default {
	name: "login",
	runOnce: true,
	async execute() {
		logger.info("The bot has logged in!");
		sendToDiscord(`**${bot.username}** has logged in to \`${process.env.IP}\` and is now ready!`);

		cron.schedule("0 * * * *", () => {
			client.channels.cache.get(channelID).send("I will AUTO Reboot in ONE minute. I will be back in 30 seconds!");
		});

		setInterval(function() {
			bot.chat("/chat g");
			bot.chat("/ac \u00a7");
		}, 3000000);

		setTimeout(function() {
			bot.chat("/ac \u00a7");
			bot.chat("/chat g");
			bot.chat("/g online");
		}, 3000);
	}
};