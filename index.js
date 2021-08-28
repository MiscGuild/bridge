
//----------------------------------------------------------Discord--------------------------------------------------------------------------
const Discord = require('discord.js');
const client = new Discord.Client({autoReconnect:true});
const serverID = "859916798111907871";
var channelID = '870857510083518515';
var staffChannelID = '880226624681951312';
var channel;
// var serverID = process.env.SERVERID;
// var channelID = process.env.OUTPUTCHANNEL;
// var staffChannel = process.env.STAFFCHANNEL;


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
var HypixelAPIKey = process.env.HypixelAPIKey;
var messages = [];
var colour = [];

module.exports = {client, bot, channelID, staffChannelID, serverID, log4js};


//---------------------------------------------------------Bot Files--------------------------------------------------------------------------
const eventFunctions = fs.readdirSync('./eventfunctions').filter((file) => file.endsWith('.js'));
const botEvents = fs.readdirSync('./botevents').filter((file) => file.endsWith('.js'));
const clientEvents = fs.readdirSync('./clientevents').filter((file) => file.endsWith('.js'));
const blacklist = require('./blacklist.json');
const regexes = require('./regex');
const emojis = require('./emojis');

//File Loops:
//Event Functions
for (let file of eventFunctions) {
  const event = require(`./eventfunctions/${file}`);
  bot.on(event.name, (...args) => event.execute(...args));
}

for (let file of botEvents) {
  const event = require(`./botevents/${file}`);
  bot.on(event.name, (...args) => event.execute(...args));
}

for (let file of clientEvents) {
  const event = require(`./clientevents/${file}`);
  client.on(event.name, (...args) => event.execute(...args));
}
  
client.on('ready', () => {

  setInterval(function() {
    bot.chat('/g online');
  }, 300000)
  
  // Emojis
  emojis.forEach((emojiID, emojiName) => {
    eval('global.'+emojiName+'='+'client.emojis.cache.get("'+emojiID+'")');
  });
  channel = client.channels.cache.get(channelID);
  

  logger.info(`The discord bot logged in! Username: ${client.user.username}!`)
  if (!channel) {
    logger.info(`I could not find the channel (${channelID})! -- 2`);
    process.exit(1);
  }
  else {
    const loggedInEmbed = new Discord.MessageEmbed()
  .setDescription(`**MiscBot** has logged onto \`${process.env.IP}\` and is now ready!`)
  .setColor('0x2f3136')
    channel.send(loggedInEmbed);
  }


  client
  .on("debug", (debug => {debugLogs.debug(debug), console.log(debug)}))
  .on("warn", (warn => {warnLogs.warn(warn), console.log(warn)}))
  .on("error", (error => {errorLogs.error(error), console.log(error)}));
})


const guild_chat = (rank_guild_chat, username_guild_chat, tag_guild_chat, message_guild_chat) => {
  if(tag_guild_chat == '[MISC]'){var tag_chat_emojis = `${MISC1}${MISC2}${MISC3}`}
  else if(tag_guild_chat == '[Active]'){var tag_chat_emojis = `${ACTIVE1}${ACTIVE2}${ACTIVE3}${ACTIVE4}`}
  else if(tag_guild_chat == '[Res]'){var tag_chat_emojis = `${RES1}${RES2}${RES3}`}
  else if(tag_guild_chat == '[GM]'){var tag_chat_emojis = `${GM1}${GM2}`}
  else if(tag_guild_chat == '[Admin]'){var tag_chat_emojis = `${ADMIN1}${ADMIN2}${ADMIN3}${ADMIN4}`}
  else if(tag_guild_chat == '[O]'){var tag_chat_emojis = `${OFFICER1}${OFFICER2}`}
  
  if(!rank_guild_chat){
    var rankChat_Emoji = ''
    colour.push('0xAAAAAA')
  }
  else if(rank_guild_chat == '[MVP+]'){
    var rankChat_Emoji = `${MVPPLUS1}${MVPPLUS2}${MVPPLUS3}${MVPPLUS4}`
    colour.push('0x55FFFF')
  }
  else if(rank_guild_chat == '[MVP++]'){
    var rankChat_Emoji = `\u200D    ${MVPPLUSPLUS1}${MVPPLUSPLUS2}${MVPPLUSPLUS3}${MVPPLUSPLUS4}`
    colour.push('0xFFAA00')
  }
  else if(rank_guild_chat == '[VIP]'){
    var rankChat_Emoji = `\u200D  ${VIP1}${VIP2}${VIP3}` 
    colour.push('0x55FF55') 
  }
  else if(rank_guild_chat == '[VIP+]'){
    var rankChat_Emoji = `\u200D     ${VIPPLUS1}${VIPPLUS2}${VIPPLUS3}` 
    colour.push('0x55FF55')
  }
  else if(rank_guild_chat == '[MVP]'){
    var rankChat_Emoji = `\u200D   ${MVP1}${MVP2}${MVP3}`
    colour.push('0x55FFFF')
  }
  return messages.push(`${rankChat_Emoji} **${username_guild_chat}** ${tag_chat_emojis}: ${message_guild_chat}`)
}


const officer_chat = (rank_officer_chat, username_officer_chat, officer_chat_tag, message_officer_chat) => {
  
  if(!rank_officer_chat){var rank_officer_chat_emoji = ''}
  else if(rank_officer_chat == '[MVP+]'){var rank_officer_chat_emoji = `${MVPPLUS1}${MVPPLUS2}${MVPPLUS3}${MVPPLUS4}`}
  else if(rank_officer_chat == '[MVP++]'){var rank_officer_chat_emoji = `\u200D    ${MVPPLUSPLUS1}${MVPPLUSPLUS2}${MVPPLUSPLUS3}${MVPPLUSPLUS4}`}
  else if(rank_officer_chat == '[VIP]'){var rank_officer_chat_emoji = `\u200D  ${VIP1}${VIP2}${VIP3}`}
  else if(rank_officer_chat == '[VIP+]'){var rank_officer_chat_emoji = `\u200D     ${VIPPLUS1}${VIPPLUS2}${VIPPLUS3}`}
  else if(rank_officer_chat == '[MVP]'){var rank_officer_chat_emoji = `\u200D   ${MVP1}${MVP2}${MVP3}`}

  // logger.info(`OFFICER > ${rank_guild_chat} ${username_guild_chat}: ${message_guild_chat}`)
  client.channels.cache.get(staffChannelID).send(`${rank_officer_chat_emoji} **${username_officer_chat}** ${officer_chat_tag}: ${message_officer_chat}`)
}


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



      const guild_requesting = (guild_requesting_rank, guild_requesting_username) => {
        if(!guild_requesting_rank){var guild_requesting_rank = ''}
        // logger.info(`-----------------------------------------------------\n**${guild_requesting_rank} ${guild_requesting_username}** is requesting to join the guild! \nA staff member can do \`)command g accept ${guild_requesting_username}\`\n-----------------------------------------------------`)
        async function check_requesting_user(){
          const MojangAPI = await fetch(`https://api.ashcon.app/mojang/v2/user/${guild_requesting_username}`)
        .then(res => res.json())
        for(var i in blacklist){
          var guild_requesting_uuid = MojangAPI.uuid
          if(blacklist[i].uuid == guild_requesting_uuid){
          return bot.chat(`/oc The player ${guild_requesting_username} is on the blacklist! Do **NOT** accept their request.`)
          }
        }
        
        const HyAPI = await fetch(`https://api.hypixel.net/player?key=${process.env.HypixelAPIKey}&uuid=${guild_requesting_uuid}&player=${guild_requesting_username}`)
        .then(response => response.json())
        if (getNetworkLevel(HyAPI.player.networkExp) > 50) {
          bot.chat(`/g accept ${guild_requesting_username}`)
        }
        else {
          bot.chat(`/oc The player ${guild_requesting_username} is not network level 50!`)
        }
        }
        check_requesting_user()
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
      
      
      var mute_time;
    
      const guild_mute = (guild_mute_rank_staff, guild_mute_staff, guild_mute_rank_username, guild_mute_username, guild_mute_time, guild_mute_type) => {
        if(!guild_mute_rank_staff){var guild_mute_rank_staff = ''}
        if(!guild_mute_rank_username){var guild_mute_rank_username = ''}
        client.channels.cache.get(staffChannelID).send(`-----------------------------------------------------\n**${guild_mute_rank_staff} ${guild_mute_staff}** has muted **${guild_mute_rank_username} ${guild_mute_username}** for **${guild_mute_time}${guild_mute_type}**\n-----------------------------------------------------`)
        let displayNickname = guild_mute_username;
        let serverMembers = client.guilds.cache.get(serverID).members.cache;
        
        let matchedMember = serverMembers.findKey(user => user.displayName.split(" ")[0] === displayNickname);
        if (!matchedMember) {return}
        serverMembers.get(matchedMember).roles.add('849100433317298207');
        if (guild_mute_type=='s') {mute_time = guild_mute_time*1000}
        else if (guild_mute_type=='m') {mute_time = guild_mute_time*60000}
        else if (guild_mute_type=='h') {mute_time = guild_mute_time*3600000}
        else if (guild_mute_type=='d') {mute_time = guild_mute_time*86400000}
        setTimeout(function() {
          if (serverMembers.get(matchedMember).roles.cache.some(role => role.id === '849100433317298207')==true) {
            serverMembers.get(matchedMember).roles.remove('849100433317298207');
          } 
         }, mute_time)
      }
      

      
    

  function getNetworkLevel(exp){
    return (Math.sqrt((2 * exp) + 30625) / 50) - 2.5
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
        
          
    
        
const blacklist_check = (blacklist_check_content) => {
  var guildMembers = blacklist_check_content.split(" ●  ");
  console.log(guildMembers)
  guildMembers.forEach(function (player, index) {
    if (checkIfUserBlacklisted(player)) {
      //bot.chat(`/g kick ${player} You have been blacklisted from the guild, Mistake? --> (discord.gg/dEsfnJkQcq)`)
    console.log("Kicking " + player + "because they are blacklisted")
    }
  })
}
    
        
          
      
    
          bot.on('guild_chat', guild_chat);
          bot.on('guild_kick', guild_kick);
          bot.on('guild_join', guild_join);
          bot.on('guild_leave', guild_leave);
          bot.on('guild_promote', guild_promote);
          bot.on('guild_demote', guild_demote);
          bot.on('guild_requesting', guild_requesting);
          bot.on('guild_joined_game', guild_joined_game);
          // bot.on('guild_left_game', guild_left_game)
          bot.on('officer_chat', officer_chat);
          //bot.on('msg_bot', msg_bot);
          bot.on('guild_mute', guild_mute);
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