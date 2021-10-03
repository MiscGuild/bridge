// -------------------------------------------------------Integrations-------------------------------------------------------------------------
import regexes from "./resources/regex.js";
import log4jsConfig from "./resources/log4jsConfigure.js";
import log4js from "log4js";
import dotenv from "dotenv";
import fs from "fs";
const eventFunctions = fs.readdirSync("./events/minecraft/eventfunctions").filter((file) => file.endsWith(".js"));
const botEvents = fs.readdirSync("./events/minecraft").filter((file) => file.endsWith(".js"));
const clientEvents = fs.readdirSync("./events/discord").filter((file) => file.endsWith(".js"));
log4js.configure(log4jsConfig);
dotenv.config();

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


// ---------------------------------------------------PrismarineJS/Mineflayer------------------------------------------------------------------
import mineflayer from "mineflayer";
import { mineflayer as mineflayerViewer } from "prismarine-viewer";
const bot = mineflayer.createBot({
	host: process.env.IP,
	port: process.env.PORT,
	username: process.env.EMAIL,
	password: process.env.PASSWORD,
	version: "1.16.4",
	auth: "microsoft",
});

export { client, bot, sendToDiscord };


// --------------------------------------------------------Bind Events--------------------------------------------------------------------------
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

for (const file of clientEvents) {
	import(`./events/discord/${file}`)
		.then((event) => {
			event = event.default;
			client.on(event.name, (...args) => event.execute(...args));
		});
}

client.login(process.env.TOKEN);
