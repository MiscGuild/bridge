//-------------------------------------------------------Integrations-------------------------------------------------------------------------
const fs = require('fs');
const log4js = require('log4js');
const log4jsConfig = require("./resources/log4jsConfigure.json")
log4js.configure(log4jsConfig);
const dotenv = require('dotenv');
dotenv.config();


//----------------------------------------------------------Discord--------------------------------------------------------------------------
const Discord = require('discord.js');
const { Client, Intents, Collection } = require('discord.js');
const client = new Client({ intents: 32509 });

var channelID = process.env.OUTPUTCHANNELID;

async function sendToDiscord(msg, color='0x2f3136', channel=channelID) {
  channel = client.channels.cache.get(channel);
  embed = new Discord.MessageEmbed()
  .setDescription(msg)
  .setColor(color);
  channel.send({embeds: [embed]});
}

// Command Handler
client.commands = new Collection();
client.slashCommands = new Collection();

require("./handler")(client);


//---------------------------------------------------PrismarineJS/Mineflayer------------------------------------------------------------------
const mineflayer = require('mineflayer');
const mineflayerViewer = require('prismarine-viewer').mineflayer;
bot = mineflayer.createBot({
  host: process.env.IP,
  port: process.env.PORT,
  username: process.env.EMAIL,
  password: process.env.PASSWORD,
  version: '1.16.4',
  auth: 'microsoft',
});

module.exports = {client, bot, sendToDiscord};


//---------------------------------------------------------Bot Files--------------------------------------------------------------------------
const eventFunctions = fs.readdirSync('./events/minecraft/eventfunctions').filter((file) => file.endsWith('.js'));
const botEvents = fs.readdirSync('./events/minecraft').filter((file) => file.endsWith('.js'));
const clientEvents = fs.readdirSync('./events/discord').filter((file) => file.endsWith('.js'));
const regexes = require('./resources/regex');

//File Loops - Source: https://github.com/xMdb/hypixel-guild-chat-bot
for (let file of eventFunctions) {
  const event = require(`./events/minecraft/eventfunctions/${file}`);
  const eventName = event.name;
  bot.on(event.name, (...args) => event.execute(...args));
  bot.chatAddPattern(regexes[event.name], `${event.name}`);
}

for (let file of botEvents) {
  const event = require(`./events/minecraft/${file}`);
  if (event.runOnce){
    bot.once(event.name, (...args) => event.execute(...args));
  } else {
    bot.on(event.name, (...args) => event.execute(...args));
  }
}

for (let file of clientEvents) {
  const event = require(`./events/discord/${file}`);
  client.on(event.name, (...args) => event.execute(...args));
}

client.login(process.env.TOKEN);
