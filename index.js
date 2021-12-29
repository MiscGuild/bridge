// -------------------------------------------------------Integrations-------------------------------------------------------------------------
import mineflayer from "mineflayer";
import { mineflayer as mineflayerViewer } from "prismarine-viewer";
import regexes from "./resources/regex.js";
import log4jsConfig from "./resources/log4jsConfigure.js";
import log4js from "log4js";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();
log4js.configure(log4jsConfig);
const eventFunctions = fs.readdirSync("./events/minecraft/eventfunctions").filter((file) => file.endsWith(".js"));
const botEvents = fs.readdirSync("./events/minecraft").filter((file) => file.endsWith(".js"));
const clientEvents = fs.readdirSync("./events/discord").filter((file) => file.endsWith(".js"));
const environment = process.env.ENVIRONMENT;


// ----------------------------------------------------------Discord--------------------------------------------------------------------------
import Discord, { Client, Collection } from "discord.js";
const client = new Client({ intents: 32509 });
const channelID = process.env.OUTPUTCHANNELID;

async function sendToDiscord(msg, color = "0x2f3136", channel = channelID) {
	channel = client.channels.cache.get(channel);
	const embed = new Discord.MessageEmbed()
		.setDescription(msg)
		.setColor(color);
	channel.send({ embeds: [embed] });
}

// Command Handler
client.commands = new Collection();
client.slashCommands = new Collection();

// --------------------------------------------------Mineflayer/PrismarineViewer---------------------------------------------------------------
let bot;
function spawnBot() {
	bot = mineflayer.createBot({
		host: process.env.IP,
		port: process.env.PORT,
		username: process.env.EMAIL,
		password: process.env.PASSWORD,
		version: "1.16.4",
		auth: process.env.AUTH
	});

	// File Loops - Source: https://github.com/xMdb/hypixel-guild-chat-bot
	for (const file of eventFunctions) {
		import(`./events/minecraft/eventfunctions/${file}`)
			.then((event) => {
				event = event.default;
				bot.on(event.name, (...args) => event.execute(...args));
				bot.chatAddPattern(regexes[event.name], `${event.name}`);
			});
	}

	for (const file of botEvents) {
		import(`./events/minecraft/${file}`)
			.then((event) => {
				event = event.default;
				if (event.runOnce) {
					bot.once(event.name, (...args) => event.execute(...args));
				}
				else {
					bot.on(event.name, (...args) => event.execute(...args));
				}
			});
	}
}


if (environment === "dev") {
	console.log("The Mineflayer bot will not spawn, and hence may effect the performance of some discord commands. \nIn order to disable this feature, set the value of ENVIRONMENT in .env to build.");
}
else if (environment === "build") {
	spawnBot();
}
else {
	throw new Error("The value of ENVIRONMENT in .env is invalid. Please set it to either build or dev.");
}

for (const file of clientEvents) {
	import(`./events/discord/${file}`)
		.then((event) => {
			event = event.default;
			client.on(event.name, (...args) => event.execute(...args));
		});
}

process.on("uncaughtException", (err) => {
	console.error(err);
	client.channels.get(process.env.ERRORCHANNELID.toString()).send(err);
}).on("unhandledRejection", (err) => {
	console.error(err);
	client.channels.get(process.env.ERRORCHANNELID.toString()).send(err);
});

export { client, bot, sendToDiscord };
client.login(process.env.TOKEN);
