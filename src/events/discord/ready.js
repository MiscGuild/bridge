import { client, bot } from "../../../index.js";
import fs from "fs";
import { channelID, staffChannelID, logChannelID, blacklistChannelID, serverID } from "../../resources/consts.js";
import log4js from "log4js";

const logger = log4js.getLogger("logs");
const errorLogs = log4js.getLogger("Errors");
const warnLogs = log4js.getLogger("Warn");
const debugLogs = log4js.getLogger("Debug");
const channels = [channelID, staffChannelID, logChannelID, blacklistChannelID];

export default {
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
		
		// Slash Commands
		const slashCommands = fs.readdirSync("./src/commands").filter((file) => file.endsWith(".js"));
		const slashCommandsArr = [];
		slashCommands.forEach((value, i) => {
			import(`../../commands/${value}`)
				.then((file) => {
					file = file.default;
					client.slashCommands.set(file.name, file);
			
					if (["MESSAGE", "USER"].includes(file.type)) {
						delete file.description;
					}
					slashCommandsArr.push(file);

					if (i == slashCommands.length - 1) {
						client.guilds.cache
							.get(serverID)
							.commands.set(slashCommandsArr);
					}
				});
		});


		// Bind logs
		client
			.on("debug", (debug => {debugLogs.debug(debug), console.log(debug);}))
			.on("warn", (warn => {warnLogs.warn(warn), console.log(warn);}))
			.on("error", (error => {errorLogs.error(error), console.log(error);}));

		setInterval(function() {
			bot.chat("/g online");
		}, 300000);
	}
};