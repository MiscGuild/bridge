//-------------------------------------------------------Integrations-------------------------------------------------------------------------
const fetch = require('node-fetch');
const { setTimeout, setInterval } = require('timers');
const fs = require('fs');
var log4js = require('log4js');
const logger = log4js.getLogger("logs");
const errorLogs = log4js.getLogger("Errors");
const warnLogs = log4js.getLogger("Warn");
const debugLogs = log4js.getLogger("Debug");
    
const dotenv = require('dotenv');
dotenv.config();


//----------------------------------------------------------Discord--------------------------------------------------------------------------
const Discord = require('discord.js');
const { Client, Intents } = require('discord.js');

// const client = new Discord.Client({autoReconnect:true});
const myIntents = new Intents(32509);
const client = new Client({ intents: myIntents });

var channelID = process.env.OUTPUTCHANNEL;
var channel;

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
});


//----------------------------------------------------------Variables-------------------------------------------------------------------------
var welcomeIndex=0;
var messages = [];
var colour = [];

module.exports = {client, bot, sendToDiscord};


//---------------------------------------------------------Bot Files--------------------------------------------------------------------------
const eventFunctions = fs.readdirSync('./eventfunctions').filter((file) => file.endsWith('.js'));
const botEvents = fs.readdirSync('./events/minecraft').filter((file) => file.endsWith('.js'));
const clientEvents = fs.readdirSync('./events/discord').filter((file) => file.endsWith('.js'));
const blacklist = require('./resources/blacklist.json');
const regexes = require('./resources/regex');

//File Loops:
//Event Functions
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


  
client.on('ready', () => {

  setInterval(function() {
    bot.chat('/g online');
  }, 300000)
  channel = client.channels.cache.get(channelID);
  

  logger.info(`The discord bot logged in! Username: ${client.user.username}!`)
  if (!channel) {
    logger.info(`I could not find the channel (${channelID})! -- 2`);
    process.exit(1);
  }
  else {
    sendToDiscord(`**MiscBot** has logged onto \`${process.env.IP}\` and is now ready!`);
  }


  client
  .on("debug", (debug => {debugLogs.debug(debug), console.log(debug)}))
  .on("warn", (warn => {warnLogs.warn(warn), console.log(warn)}))
  .on("error", (error => {errorLogs.error(error), console.log(error)}));
})


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
  

setInterval(() => {
  if(!messages.length){return}    
  
  const messagesEmbed = new Discord.MessageEmbed()
  .setDescription(`${messages.join('\r\n').replace("_", "\\_")}`)
  var colourrand = colour[Math.floor(Math.random() * colour.length)]
  if (colour.length>1) {
    colourrand = '0x2f3136'
    while (colourrand=='0x2f3136') {colourrand = colour[Math.floor(Math.random() * colour.length)];}
  }
  messagesEmbed.setColor(colourrand)
  channel.send(messagesEmbed);

  colour = []
  messages = []
}, 650); //How often should we send the message groupings (MS)
    

      
log4js.configure({
  appenders: { 
    logs: { type: 'console', 
    layout: {
      type: 'pattern',
      pattern: '%[%d{yyyy/MM/dd-hh.mm.ss}%] --> %m',
    },
  },
    McChatLogs: { type: 'file', filename: 'logs/logs.log',
    layout: {
      type: 'pattern',
      pattern: '%d{yyyy/MM/dd-hh.mm.ss} -> %m',
      maxLogSize: 5000,
      compress: true
    },
  
    },
    Errors: { type: 'file', filename: 'logs/Errors.log',
    layout: {
      type: 'pattern',
      pattern: '%d{yyyy/MM/dd-hh.mm.ss} -> %m',
      maxLogSize: 5000,
      compress: true
    },
  },
  Warn: { type: 'file', filename: 'logs/Warns.log',
  layout: {
    type: 'pattern',
    pattern: '%d{yyyy/MM/dd-hh.mm.ss} -> %m',
    maxLogSize: 5000,
    compress: true
  },
  },
  Debug: { type: 'file', filename: 'logs/Debug.log',
  layout: {
    type: 'pattern',
    pattern: '%d{yyyy/MM/dd-hh.mm.ss} -> %m',
    maxLogSize: 5000,
    compress: true
  },
},
  },
  categories: { 
    default: { 
      appenders: ['logs'], level: 'info' 
    },
    McChatLogs: { 
      appenders: ['McChatLogs'], level: 'info' 
    },
    Errors: { 
      appenders: ['Errors'], level: 'error' 
    },
    Warn: { 
      appenders: ['Warn'], level: 'warn' 
    },
    Debug: { 
      appenders: ['Debug'], level: 'debug' 
    },

  }
});

client.login(process.env.TOKEN);
