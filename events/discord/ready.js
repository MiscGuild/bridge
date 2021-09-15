const index = require("../../index.js");
const client = index.client;
const bot = index.bot;
const sendToDiscord = index.sendToDiscord;
const channelID = process.env.OUTPUTCHANNELID;

const log4js = require("log4js");
const logger = log4js.getLogger("logs");
const errorLogs = log4js.getLogger("Errors");
const warnLogs = log4js.getLogger("Warn");
const debugLogs = log4js.getLogger("Debug");

module.exports = {
	name: "ready",
	async execute() {
		channel = client.channels.cache.get(channelID);
        
		logger.info(`The discord bot logged in! Username: ${client.user.username}!`);
		if (!channel) {
			logger.info(`I could not find the channel (${channelID})! -- 2`);
			process.exit(1);
		}
		else {
			sendToDiscord(`**MiscBot** has logged onto \`${process.env.IP}\` and is now ready!`);
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