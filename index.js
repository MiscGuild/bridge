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
const client = new Discord.Client({autoReconnect:true});
var channelID = process.env.OUTPUTCHANNEL;
var channel;

async function sendToDiscord(msg, color='0x2f3136', channel=channelID) {
  channel = client.channels.cache.get(channel);
  embed = new Discord.MessageEmbed()
  .setDescription(msg)
  .setColor(color);
  channel.send(embed);
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








const guild_kick = (Rank1_guild_kick, username1_guild_kick, Rank2_guild_kick, username2_guild_kick) => {
  if(!Rank1_guild_kick){var Rank1_guild_kick = ''}
  if(!Rank2_guild_kick){var Rank1_guild_kick = ''}
  // logger.info(`-----------------------------------------------------\n**${Rank1_guild_kick} ${username1_guild_kick}** was kicked from the guild by **${Rank2_guild_kick} ${username2_guild_kick}**\n-----------------------------------------------------`)
  messages.push(`-----------------------------------------------------\n**${Rank1_guild_kick} ${username1_guild_kick}** was kicked from the guild by **${Rank2_guild_kick} ${username2_guild_kick}**\n-----------------------------------------------------`)
}


async function checkIfUserBlacklisted(user){
  const MojangAPI = await fetch(`https://api.ashcon.app/mojang/v2/user/${user}`)
  .then(res => res.json())
  for(var i in blacklist){
    if(blacklist[i].uuid === MojangAPI.uuid) {
console.log(blacklist[i]+"is equal to "+MojangAPI.uuid+", returning true.")
      return true;
}
  }
console.log("not blacklisted returning false")
return false;
}


      const guild_join = (Rank_guild_join, username_guild_join) => {
        var welcomeMessages = [
          `Welcome to the #21 guild on Hypixel, Miscellaneous! Join the discord | discord.gg/misc`,
          `Welcome to the guild! Make sure to join the discord at discord.gg/misc`,
          `Welcome to the guild, ${username_guild_join}! Join the discord at discord.gg/misc
`,
          `Welcome to the guild, ${username_guild_join}! Interact with the community more at discord.gg/misc`,
        ];
        if (!Rank_guild_join) {
          var Rank_guild_join = "";
        }
        messages.push(
          `-----------------------------------------------------\n**${Rank_guild_join} ${username_guild_join}** joined the guild!\n-----------------------------------------------------`
        );
        // logger.info(`-----------------------------------------------------\n**${Rank_guild_join} ${username_guild_join}** joined the guild!\n-----------------------------------------------------`)

        setTimeout(() => {
          bot.chat(welcomeMessages[welcomeIndex]);
          welcomeIndex++;
          if (welcomeIndex === 4) {
            welcomeIndex = 0;
          }
        }, 6000);
        console.log(checkIfUserBlacklisted(username_guild_join));
        if (checkIfUserBlacklisted(username_guild_join) === true) {
          bot.chat(
            `/g kick ${username_guild_join} You have been blacklisted from the guild, Mistake? --> (discord.gg/dEsfnJkQcq)`
          );
          console.log(
            "Kicking " + username_guild_join + " because they are blacklisted"
          );
        }
      };




      const guild_leave = (Rank_guild_leave, username_guild_leave) => {
        if(!Rank_guild_leave){var Rank_guild_leave = ''}
        // logger.info(`-----------------------------------------------------\n**${Rank_guild_leave} ${username_guild_leave}** left the guild!\n-----------------------------------------------------`)
        messages.push(`-----------------------------------------------------\n**${Rank_guild_leave} ${username_guild_leave}** left the guild!\n-----------------------------------------------------`)
      }



      const guild_promote = (guild_promote_rank, guild_promote_username, guild_promote_oldRank, guild_promote_newRank) => {
        if(!guild_promote_rank){var guild_promote_rank = ''}
        // logger.info(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from **${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`)
        messages.push(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from ${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`)
      }


      const cannot_say_same_msg_twice = () => {
        // logger.info(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from **${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`)
        messages.push("**Error: ** `You cannot say the same message twice!`")
      }
      


      const comment_blocked = (comment_blocked_comment, comment_blocked_reason) => {
        // logger.info(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from **${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`)
        messages.push(`**Error: ** \`Your comment, \'${comment_blocked_comment}\' was blocked for \'${comment_blocked_reason}\'\``)
      }



      const guild_demote = (guild_demote_rank, guild_demote_username, guild_demote_oldRank, guild_demote_newRank) => {
        if(!guild_demote_rank){var guild_demote_rank = ''}
        // logger.info(`-----------------------------------------------------\n**${guild_demote_rank} ${guild_demote_username}** was promoted from **${guild_demote_oldRank} to ${guild_demote_newRank}!\n-----------------------------------------------------`)
        messages.push(`-----------------------------------------------------\n**${guild_demote_rank} ${guild_demote_username}** was demoted from ${guild_demote_oldRank} to ${guild_demote_newRank}!\n-----------------------------------------------------`)
      }



      const guild_left_game = (guild_left_game_name) => {
        // logger.info(`${guild_left_game_name} left the game.`)
        messages.push(`${guild_left_game_name} left the game.`)
        colour.push('0x2f3136')
      }      

      
      const guild_joined_game = (guild_joined_game_name) => {
        messages.push(`Welcome back, **${guild_joined_game_name}**!`)
        colour.push('0x2f3136')
      }


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
        
          
    
    
          //bot.on('guild_chat', guild_chat);
          bot.on('guild_kick', guild_kick);
          bot.on('guild_join', guild_join);
          bot.on('guild_leave', guild_leave);
          bot.on('guild_promote', guild_promote);
          bot.on('guild_demote', guild_demote);
          //bot.on('guild_requesting', guild_requesting);
          bot.on('guild_joined_game', guild_joined_game);
          // bot.on('guild_left_game', guild_left_game)
          //bot.on('officer_chat', officer_chat);
          //bot.on('msg_bot', msg_bot);
          //bot.on('guild_mute', guild_mute);
          //bot.on('guild_unmute', guild_unmute);
          bot.on('cannot_say_same_msg_twice', cannot_say_same_msg_twice);
          bot.on('comment_blocked',comment_blocked);
          //bot.on('guild_online', guild_online);
          // bot.on('blacklist_check', blacklist_check);

    
    
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