//-------------------------------------------------------Integrations-------------------------------------------------------------------------
const fs = require('fs');
var log4js = require('log4js');
const log4jsConfig = require("./resources/log4jsConfigure.json")
const dotenv = require('dotenv');
dotenv.config();


//----------------------------------------------------------Discord--------------------------------------------------------------------------
const Discord = require('discord.js');
const { Client, Intents, Collection } = require('discord.js');
const client = new Client({ intents: 32509 });
module.exports = client;

var channelID = process.env.OUTPUTCHANNEL;

async function sendToDiscord(msg, color='0x2f3136', channel=channelID) {
  channel = client.channels.cache.get(channel);
  embed = new Discord.MessageEmbed()
  .setDescription(msg)
  .setColor(color);
  channel.send({embeds: [embed]});
}


//---------------------------------------------------PrismarineJS/Mineflayer------------------------------------------------------------------
const mineflayer = require('mineflayer');
const mineflayerViewer = require('prismarine-viewer').mineflayer;
bot = mineflayer.createBot({
  host: process.env.IP,
  port: process.env.PORT,
  username: process.env.EMAIL,
  password: process.env.PASSWORD,
  version: '1.16.4',
  auth: microsoft,
});

module.exports = {client, bot, sendToDiscord};


//---------------------------------------------------------Bot Files--------------------------------------------------------------------------
const eventFunctions = fs.readdirSync('./eventfunctions').filter((file) => file.endsWith('.js'));
const botEvents = fs.readdirSync('./events/minecraft').filter((file) => file.endsWith('.js'));
const clientEvents = fs.readdirSync('./events/discord').filter((file) => file.endsWith('.js'));
const regexes = require('./resources/regex');

//File Loops - Source: https://github.com/xMdb/hypixel-guild-chat-bot
for (let file of eventFunctions) {
  const event = require(`./eventfunctions/${file}`);
  bot.on(event.name, (...args) => event.execute(...args));
}

for (let file of botEvents) {
  const event = require(`./events/minecraft/${file}`);
  bot.on(event.name, (...args) => event.execute(...args));
}

for (let file of clientEvents) {
  const event = require(`./events/discord/${file}`);
  client.on(event.name, (...args) => event.execute(...args));
}

// Command Handler
client.commands = new Collection();
client.slashCommands = new Collection();

require("./handler")(client);


bot.chatAddPattern(regexes.guildOnline,'guild_online', 'Set status to number of players in guild online');
bot.chatAddPattern(regexes.blacklistCheck, 'blacklist_check', 'Look for blacklisted players in the guild');
bot.chatAddPattern(regexes.guildChat, 'guild_chat', 'Custom Guild Chat Setup');
bot.chatAddPattern(regexes.officerChat, 'officer_chat', 'Custom Officer guild Chat Setup');
bot.chatAddPattern(regexes.guildKick, 'guild_kick', 'Guild Kick Setup');
bot.chatAddPattern(regexes.guildJoin, 'guild_join', 'Guild Join Setup');
bot.chatAddPattern(regexes.guildLeave, 'guild_leave', 'Guild leave Setup');
bot.chatAddPattern(regexes.guildPromote, 'guild_promote', 'Guild promote Setup');
bot.chatAddPattern(regexes.cannotSaySameMessageTwice, 'cannot_say_same_msg_twice', 'Sends a message when hypixel blocks for spam.');
bot.chatAddPattern(regexes.commentBlocked, 'comment_blocked', 'Sends a message when hypixel blocks for breaking chat rules.');
bot.chatAddPattern(regexes.guildDemote, 'guild_demote', 'Guild demote Setup');
bot.chatAddPattern(regexes.guildRequesting, 'guild_requesting', 'Guild requesting Setup');
bot.chatAddPattern(regexes.guildLeftGame, 'guild_left_game', 'Guild left game Setup');
bot.chatAddPattern(regexes.guildJoinedGame, 'guild_joined_game', 'Guild joined game Setup');
bot.chatAddPattern(regexes.guildMute, 'guild_mute', 'Guild mute Setup');
bot.chatAddPattern(regexes.guildUnmute, 'guild_unmute', 'Guild unmute Setup');
bot.chatAddPattern(regexes.msgBot, 'msg_bot', 'Bot msg in game Setup');
    
log4js.configure(log4jsConfig);

client.login(process.env.TOKEN);
