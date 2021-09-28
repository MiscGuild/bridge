const index = require("../../index.js");
const client = index.client;
const bot = index.bot;
const channels = [process.env.OUTPUTCHANNELID, process.env.STAFFCHANNELID, process.env.LOGCHANNELID, process.env.BLACKLISTCHANNEL];

const log4js = require("log4js");
const logger = log4js.getLogger("logs");
const errorLogs = log4js.getLogger("Errors");
const warnLogs = log4js.getLogger("Warn");
const debugLogs = log4js.getLogger("Debug");

module.exports = {
	name: "ready",
	async execute() {
		logger.info(`The discord bot logged in! Username: ${client.user.username}!`);
		for (let i = 0; i < channels.length; i++) {
			const channel = client.channels.cache.get(channels[i]);
			if (!channel) {
				logger.info(`The channel ${channels[i]} could not be found. Check the channel ID and if the bot has access to the server!`);
				process.exit(1);
			}
		}
      
		client
			.on("debug", (debug => {debugLogs.debug(debug), console.log(debug);}))
			.on("warn", (warn => {warnLogs.warn(warn), console.log(warn);}))
			.on("error", (error => {errorLogs.error(error), console.log(error);}));

		setInterval(function() {
			bot.chat("/g online");
		}, 300000);
	}
};