
//----------------------------------------------------------Discord--------------------------------------------------------------------------
const Discord = require('discord.js');
const client = new Discord.Client({autoReconnect:true});
var prefix = ')';
const serverID = "859916798111907871";
var channelID = '870857510083518515';
var staffChannel = '880226624681951312';
var channel;
// var serverID = process.env.SERVERID;
// var channelID = process.env.OUTPUTCHANNEL;
// var staffChannel = process.env.STAFFCHANNEL;


//-------------------------------------------------------Integrations-------------------------------------------------------------------------
const fetch = require('node-fetch');
var crypto = require("crypto");
const { setTimeout, setInterval } = require('timers');
const fs = require('fs');
var cron = require('node-cron');
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
  version: '1.8.9',
});
bindEvents(bot);


//----------------------------------------------------------Variables-------------------------------------------------------------------------
var welcomeIndex=0;
var HypixelAPIKey = process.env.HypixelAPIKey;
var messages = [];
var colour = [];
var sLogs = []

module.exports = {client, staffChannel, bot, serverID};


//---------------------------------------------------------Bot Files--------------------------------------------------------------------------
const blacklist = require('./blacklist.json');
const regexes = require('./regex');
const eventFunctions = fs.readdirSync('./eventFunctions').filter((file) => file.endsWith('.js'));
const emojis = require('./emojis');

//File Loops:
//Event Functions
for (let file of eventFunctions) {
  const event = require(`./eventFunctions/${file}`);
  bot.on(event.name, (...args) => event.execute(...args));
}



  
client.on('ready', () => {
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
  client.channels.cache.get(staffChannel).send(`${rank_officer_chat_emoji} **${username_officer_chat}** ${officer_chat_tag}: ${message_officer_chat}`)
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
        var welcomeMessages = [`Welcome to the #21 guild on Hypixel, Miscellaneous! Join the discord | discord.gg/misc`,`Welcome to the guild! Make sure to join the discord at discord.gg/misc`,`Welcome to the guild, ${username_guild_join}! Join the discord at discord.gg/misc
`,`Welcome to the guild, ${username_guild_join}! Interact with the community more at discord.gg/misc`];
        if(!Rank_guild_join){var Rank_guild_join = ''}
        messages.push(`-----------------------------------------------------\n**${Rank_guild_join} ${username_guild_join}** joined the guild!\n-----------------------------------------------------`)
        // logger.info(`-----------------------------------------------------\n**${Rank_guild_join} ${username_guild_join}** joined the guild!\n-----------------------------------------------------`)

        setTimeout(() => {
          bot.chat(welcomeMessages[welcomeIndex])
          welcomeIndex ++;
          if (welcomeIndex===4) {
            welcomeIndex=0;
          }
        }, 6000);
	console.log(checkIfUserBlacklisted(username_guild_join))
	if (checkIfUserBlacklisted(username_guild_join)===true) {
		bot.chat(`/g kick ${username_guild_join} You have been blacklisted from the guild, Mistake? --> (discord.gg/dEsfnJkQcq)`)
		console.log("Kicking "+username_guild_join + " because they are blacklisted")
	}
      }




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
        client.channels.cache.get(staffChannel).send(`-----------------------------------------------------\n**${guild_mute_rank_staff} ${guild_mute_staff}** has muted **${guild_mute_rank_username} ${guild_mute_username}** for **${guild_mute_time}${guild_mute_type}**\n-----------------------------------------------------`)
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
      

      
      


      
      const msg_bot = (msg_bot_username, msg_bot_message) => {

        async function msg_bot_aysnc() {
          if(msg_bot_message.startsWith('weeklygexp'||'weeklygxp')){
  
            var minecraftAPI = await fetch(`https://api.mojang.com/users/profiles/minecraft/${msg_bot_username}`)
            .then(res => res.json())
          fetch(`https://api.hypixel.net/guild?key=${HypixelAPIKey}&player=${minecraftAPI.id}`)
          .then(res => res.json())
          .then(data => {
              for (var item in data.guild.members) {
                  if (data.guild.members[item].uuid == minecraftAPI.id) {
                    function gexpFunction(gexpLIST) {
                      let sum = 0;
                      for (let gexp of Object.values(gexpLIST)) {
                        sum += gexp;
                      }
                      return sum; 
                    }
                    let gexpLIST = data.guild.members[item].expHistory
                    var randomID = crypto.randomBytes(7).toString('hex');
                    bot.chat(`/w ${msg_bot_username} ${msg_bot_username}'s total weekly gexp: ${gexpFunction(gexpLIST).toLocaleString()} | ${randomID}`); // 650

                  };
              }
          });
        } else if(msg_bot_message.startsWith('Boop!')) {bot.chat(`/boop ${msg_bot_username}`)}

        else{
          let usernameMention = msg_bot_message.split(" ")[0]
          var randomIDP = crypto.randomBytes(7).toString('hex');

        var minecraftAPI = await fetch(`https://api.mojang.com/users/profiles/minecraft/${usernameMention}`)
        .then(res => res.json())
        if(!minecraftAPI){return bot.chat(`/w ${msg_bot_username} "${usernameMention}" was not found (Try giving me a username and/or check spelling) | ${randomIDP} `)}

      fetch(`https://api.hypixel.net/guild?key=${HypixelAPIKey}&player=${minecraftAPI.id}`)
      .then(res => res.json())
      .then(data => {
        if(!data.guild){return bot.chat(`/w ${msg_bot_username} "${usernameMention}" was not found (Try giving me a username and/or check spelling) | ${randomIDP} `)}
          for (var item in data.guild.members) {
              if (data.guild.members[item].uuid == minecraftAPI.id) {
                function gexpDFunction(gexpLIST) {
                  let sum = 0;
                  for (let gexp of Object.values(gexpLIST)) {
                    sum += gexp;
                  }
                
                  return sum; 
                }
                let gexpLIST = data.guild.members[item].expHistory
                var randomID = crypto.randomBytes(7).toString('hex');
                bot.chat(`/w ${msg_bot_username} ${minecraftAPI.name}'s total weekly gexp: ${gexpDFunction(gexpLIST).toLocaleString()} | ${randomID}`); 

              };
          }
      });
    }
  }
  msg_bot_aysnc()
}

  function getNetworkLevel(exp){
    return (Math.sqrt((2 * exp) + 30625) / 50) - 2.5
  }

    
function bindEvents(bot) {
  bot.on('error', function(err) { // if the bot errors or crashes i made a function cause cool
      console.log('Error attempting to reconnect: ' + err + '.');
      errorLogs.error('Error attempting to reconnect: ' + err + '.')
      channel.send('**BOT WAS KICKED, IT WILL REBOOT IN 75s**')
      setTimeout(function(){ 
        console.log('Shutting down for automatic relog')    
        channel.send('**SHUTTING DOWN FOR RELOG**')  
        process.exit()
      }, 75000);
  });


  bot.on('kicked', function(reason) {
    console.log(reason)
    console.log('I was kicked, auto relog will start in ~75s')
    channel.send('**BOT WAS KICKED, IT WILL REBOOT IN 75s**\n```'+ reason + '```')
    bot.end();
    setTimeout(function(){ 
      console.log('Shutting down for automatic relog')    
      channel.send('**SHUTTING DOWN FOR RELOG**')  
      process.exit()
    }, 75000);
  });
};
    
bot.once('spawn', () => {
  logger.info('Bot logged in!')

  cron.schedule('0 * * * *', () => {
    channel.send(`I will AUTO Reboot in ONE minute. I will be back in 30 seconds!`)
  });

  setInterval(function(){
    var randomIDQ = crypto.randomBytes(5).toString('hex');
    bot.chat('/hub')
    setTimeout (function(){
      for (var i = 0; i<15; i++) {bot.chat('/PLSSENDMETOLIMBO')}
    },5000)
    bot.chat('/chat g')
  }, 3000000);

  setTimeout (function(){
    bot.chat('/g online')
    for (var i = 0; i<15; i++) {bot.chat('/PLSSENDMETOLIMBO')}
  },5000)
  bot.chat('/chat g')

  setTimeout (function(){
    var randomIDQ = crypto.randomBytes(5).toString('hex');
  }, 10000)

  setInterval(function(){
     bot.chat('/g online') 
  }, 300000); // run g online every 5 mins
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
    
      client.on('message', message => {
        if(message.channel.id == channelID){
        if(message.content.startsWith(prefix)){return}
        if(message.author.bot){return}
        if(message.attachments.size > 0){return}
        var user = message.guild.member(message.member)
        if(message.content.length > 100){return message.channel.send(`Your message is too long! ${message.content.length}/100`)}
        bot.chat(`/gc [${user.displayName.split(" ")[0]}] - ${message.content}`)
        McChatLogger.info(`DISCORD > [${message.author.tag}/${message.author.id}]: ${message.content}`)
        message.delete()
      }
      });
    
      client.on('message', message => {
      
        if(message.channel.id == staffChannel){
        if(message.content.startsWith(prefix)){return}
        if(message.author.bot){return}
        if(message.attachments.size > 0){return}
        var user = message.guild.member(message.member)
        if(message.content.length > 250){return message.channel.send(`Your message is too long! ${message.content.length}/250`)}
        bot.chat(`/oc [${user.displayName.split(" ")[0]}] -  ${message.content}`)
        McChatLogger.info(`DISCORD (OFFICER CHAT)> [${message.author.tag}/${message.author.id}]: ${message.content}`)
        message.delete()
      }
      });

      var log4js = require('log4js');
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
      const McChatLogger = log4js.getLogger("McChatLogs");
      const logger = log4js.getLogger("logs");
      const errorLogs = log4js.getLogger("Errors");
      const warnLogs = log4js.getLogger("Warn");
      const debugLogs = log4js.getLogger("Debug");
    
      if(client){
      client.on('message', message => {
        if (!message.content.startsWith(prefix) || message.author.bot) return;
    
        const args = message.content.slice(prefix.length).trim().split(' ');
        const command = args.shift().toLowerCase();
        
        if (command === 'help'.toLowerCase()) {
          if (message.member.roles.cache.some(role => role.name === 'Staff')) {
          return message.channel.send({embed: {
              color: 0x2f3136,
              title: "Commands",
              fields: [
                {
                  name: 'help',
                  value: 'Prints this message',
                inline: false,
              },
              {
                name: 'reboot',
                value: 'Restarts the bot',
                inline: false,
              },
              {
                name: 'chat',
                value: 'Any chat message ingame',
                inline: false,
              },
              {
                name: 'command',
                value: 'Run a command',
                inline: false,
              },
              {
                name: 'blacklist',
                value: 'Add, list, or remove people on the blacklist',
                inline: false,
              },
            ],
            footer: {
              text: `You can send messages ingame by typing in #bridge`
            },
          }})
          } else {
            return message.channel.send({embed: {
              color: 0x2f3136,
              title: "Commands",
              fields: [
                {
                  name: 'help',
        value: 'Prints this message',
        inline: false,
                },
        ],
        footer: {
                text: `You can send messages ingame by typing in #bridge`
              },
      }})
          }
        }
        else if (command === 'chat'.toLowerCase()) {
          if (message.member.roles.cache.some(role => role.name === 'Staff')) {
              var user = message.guild.member(message.member)
    
              if (!args.length) {
           return message.channel.send({embed: {
                color: 0x2f3136,
                title: "Error",
                description: `You need to provide a message for me to send!`,
              }})
            }
            return bot.chat(`[${user.displayName}]: ${args.join(" ").toString()}`)
          } else {return message.channel.send({embed: {
            color: 0x2f3136,
            title: "Error",
            description: `It seems you are lacking the permission to run this command.`,
          }})}
          }
    
          else if (command === 'command'.toLowerCase()) {
            try {
            if (message.member.roles.cache.some(role => role.name === 'Staff')) {
              var user = message.guild.member(message.member)
    
              if (!args.length) {
                return message.channel.send({embed: {
                  color: 0x2f3136,
                  title: "Error",
                  description: `You need to provide a message for me to send!`,
                }})
              }
              if(args[1] == 'kick'.toLowerCase()){return bot.chat(`/${args.join(" ").toString()} [Kicker: ${user.displayName}]`), message.react('✅')}
              if(args[0] == 'oc'.toLowerCase()){  
                    if(!args[1]){return message.channel.send({embed: {
                      color: 0x2f3136,
                      title: "Error",
                      description: `You need to provide a message for me to send!`,
                    }})}
                return bot.chat(`/oc [${user.displayName}] ${args.join(" ").toString().replace('oc', '')}`), message.react('✅')}
    
              return bot.chat(`/${args.join(" ").toString()}`), message.react('✅')
            } else {return message.channel.send({embed: {
              color: 0x2f3136,
              title: "Error",
              description: `It seems you are lacking the permission to run this command.`,
            }})}
          } catch(err){ errorLogs.error(err)
            message.channel.send({embed: {
            color: 0x2f3136,
            title: "Error",
            description: `An unknown error has occurred! Please contact @elijahsus to fix it!`,
          }})}
            }
    
          else if (command === 'reboot'.toLowerCase()) {
            if (message.member.roles.cache.some(role => role.name === 'Staff') || message.author.id === '308343641598984203') {
              var user = message.guild.member(message.member)
    
              message.channel.send({embed: {
                color: 0x2f3136,
                title: "Rebooting",
                description: `The bot will restart in \`45s\``,
              }}), logger.info(`Bot will reboot in 45s due to ${user.displayName} running the reboot command`)
              var randomID = crypto.randomBytes(7).toString('hex'); 
              channel.send(`Bot will reboot in 45s due to ${user.displayName} running the reboot command`)
                 setTimeout(() => {
                  message.channel.send({embed: {
                    color: 0x2f3136,
                    title: "Rebooting",
                    description: `The bot is now restarting`,
                  }})
                  message.channel.send()
                  process.exit()
                 }, 45000)
              
              
            } else {return message.channel.send({embed: {
              color: 0x2f3136,
              title: "Error",
              description: `It seems you are lacking the permission to run this command.`,
            }})}
            }
    
        else if (command === 'blacklist'.toLowerCase()) {
        if (message.member.roles.cache.some(role => role.name === 'Staff')) {
          if(!args[0]){
    
    
              const embed = new Discord.MessageEmbed()
                .setTitle("Blacklist")
                .setColor(0x2f3136)
                .setDescription(`The list below shows everyone who is on the blacklist (Total: ${blacklist.length})`)
                .setFooter("The name is based on the name that was givin at the time of blacklist, refer to the UUID if the user has changed their name.")
    
                blacklist.forEach(element => 
            embed.addField(`${element.user}`, `**End:** ${element.end}\n**Reason:** ${element.reason}\n**UUID:** ${element.uuid}\n[Message Link](https://discord.com/channels/522586672148381726/709370599809613824/${element.msgID})`)
            )
            if(embed.length >= 2000) {
              const embed2 = new Discord.MessageEmbed()
                .setColor(0x2f3136)
                .setTitle('Error | Too many people on blacklist')
                .setDescription("Discord has a character limit and we have reached it with the message trying to be sent. Look at the blacklist list in <#709370599809613824>")
               return message.channel.send(embed2)
            }
            message.channel.send({embed});
          }
        if(args[0]){
    
    
          if(args[0] == 'add'.toLowerCase()) {
            if(!args[1]){return message.channel.send({embed: {
              color: 0x2f3136,
              title: "Error | Invalid Arguments",
              description: '```'+ prefix +'blacklist <add/remove> <user>\n                        ^^^^^^\nYou must specify a user to add to the blacklist```',
            }});
          }
            async function blacklistadd() {
              if(!args[2]){return message.channel.send({embed: {
                color: 0x2f3136,
                title: "Error | Invalid Arguments",
                description: '```'+ prefix +'blacklist add <user> <end> <reason>\n                      ^^^^^\nYou must specify an end date (It can be never)```',
              }});
            }
            if(!args[3]){return message.channel.send({embed: {
              color: 0x2f3136,
              title: "Error | Invalid Arguments",
              description: '```'+ prefix +'blacklist add <user> <end> <reason>\n                               ^^^^^\nYou must specify a reason for the blacklist```',
            }});
          }
    
          const MojangAPI = await fetch(`https://api.ashcon.app/mojang/v2/user/${args[1]}`)
          .then(res => res.json())
          if(!MojangAPI.uuid){return message.channel.send({embed: {
            color: 0x2f3136,
            title: "Error",
            description: `I have encountered an error while attempting your request, a detailed log is below.\n\`\`\`Error: ${MojangAPI.code}, ${MojangAPI.error}\nReason: ${MojangAPI.reason}\`\`\``,
          }});
          }
          for(const i in blacklist){
            if(blacklist[i].uuid == MojangAPI.uuid ){return message.channel.send({embed: {
              color: 0x2f3136,
              title: "Error",
              description: `That user appears to already be on the blacklist. To check who is on the blacklist please run the \`${prefix}blacklist\` command`,
            }})}
    
          }
          function addUserToBlacklist(user, uuid, end, reason) {    
            return new Promise((resolve, reject) => {
              const embed = new Discord.MessageEmbed()
              .setTitle(user)
              .setAuthor("Blacklist", "https://media.discordapp.net/attachments/522930879413092388/849317688517853294/misc.png")          /*           * Alternatively, use "#00AE86", [0, 174, 134] or an integer number.           */
              .setColor('ff0000')
              .setFooter(`UUID: ${uuid}`)
              .setThumbnail(`https://visage.surgeplay.com/full/${uuid}.png`)
              .setTimestamp()
              .setURL(`http://plancke.io/hypixel/player/stats/${uuid}`)
           
              .addField("IGN:", user, false)
              .addField("End:", end, false)
              .addField("Reason:", reason, false)
    
              client.channels.cache.get('709370599809613824').send(embed).then(blistmsg => {
                var msgID = blistmsg.id
                blacklist.push({user, uuid, end, reason, msgID})  }) 
    
              fs.writeFile('blacklist.json', JSON.stringify(blacklist), (err) => {
                if (err) reject(err)
                return message.channel.send({embed: {
                  color: 0x2f3136,
                  title: "Done ☑️",
                  thumbnail: `https://crafatar.com/avatars/${MojangAPI.uuid}`,
                  description: `I have added the user \`${MojangAPI.username}\` to the blacklist! To see who is on the blacklist please run \`${prefix}blacklist\` or see <#709370599809613824>`,
                }})          
              })
            });
          }
          addUserToBlacklist(MojangAPI.username, MojangAPI.uuid, args[2], args.slice(3).join(' '))
    
        }
        blacklistadd();
      }
    
         else if(args[0] == 'remove'.toLowerCase()) {
          if(!args[1]){return message.channel.send({embed: {
            color: 0x2f3136,
            title: "Error | Invalid Arguments",
            description: '```'+ prefix +'blacklist <add/remove> <user>\n                        ^^^^^^\nYou must specify a user to remove from the blacklist```',
          }});
        }
          async function blacklistremove() {
            try{
        const MojangAPI = await fetch(`https://api.ashcon.app/mojang/v2/user/${args[1]}`)
        .then(res => res.json())
        if(!MojangAPI.uuid){return message.channel.send({embed: {
          color: 0x2f3136,
          title: "Error",
          description: `I have encountered an error while attempting your request, a detailed log is below.\n\`\`\`Error: ${MojangAPI.code}, ${MojangAPI.error}\nReason: ${MojangAPI.reason}\`\`\``,
        }});
        } 
     
    
        function removeUserFromBlacklist(uuid) {    
          return new Promise((resolve, reject) => {
            var found = false;
            for(var i = 0; i < blacklist.length; i++) {
                if (blacklist[i].uuid == uuid) {
                    found = true;
                    console.log('found uuid')
                    break;
                }
            }
            if(!found){return message.channel.send({embed: {
              color: 0x2f3136,
              title: "Error",
              description: `That user appears to not be on the blacklist. To check who is on the blacklist please run the \`${prefix}blacklist\` command`,
            }})}
          if(found){
            for(var i in blacklist){
    
             if( blacklist[i].uuid == uuid){
               client.channels.cache.get('709370599809613824').messages.fetch(blacklist[i].msgID).then(msg => {if(!message){return message.channel.send('The message was not found, please delete it manually')} msg.delete()})
               blacklist.splice(i, 1)
                fs.writeFile('blacklist.json', JSON.stringify(blacklist), (err) => {
                  if (err) reject(err)
                return message.channel.send({embed: {
                color: 0x2f3136,
                title: "Done ☑️",
                thumbnail: `https://crafatar.com/avatars/${MojangAPI.uuid}`,
                description: `I have removed the user \`${MojangAPI.username}\` from the blacklist! To see who is on the blacklist please run \`${prefix}blacklist\` or see <#709370599809613824>`,
              }})
            })
                  
              }
            }
          }
          })
        }
       removeUserFromBlacklist(MojangAPI.uuid)
      
      }catch(err){message.channel.send({embed: {
        color: 0x2f3136,
        title: "Error",
        description: `An unexpected error has occurred. Please contact Elijah or if hes at camp whoever he gave console to before he left.`,
      }})
      return console.log(err)
      }
    }
    
      blacklistremove();
      
         }else if(args[0] == 'dump'.toLowerCase()) {return message.channel.send({embed: {
          color: 0x2f3136,
          title: "Blacklist Dump",
          description: `Attached is the blacklist database, blacklists are stored in an array in a separate \`.JSON\` file. `,
        }, files: ["./blacklist.json"]})   
         }  else {return message.channel.send({embed: {
          color: 0x2f3136,
          title: "Error | Invalid Args",
          description: `The second argument does not match up with my code. You must use \`add\`, \`remove\`, or \`dump\``,
        }})
    
         }
        
        }
        } else {return message.channel.send({embed: {
          color: 0x2f3136,
          title: "Error",
          description: `It seems you are lacking the permission to run this command.`,
        }})
       } 
      }
      })}

bot.on('message', message => {
  var msg = message.toString()
  logger.info(message.toString())

  if(msg == 'Unknown command. Type "help" for help.'){return}
  if(msg == 'A kick occurred in your connection, so you have been routed to limbo!'){return}
  if(msg == 'disconnect.spam'){return}
  if(msg == 'You were spawned in Limbo.'){return}
  if(msg == '/limbo for more information.'){return}

  sLogs.push(msg)
  McChatLogger.info(msg)
})

setInterval(() => {
  if(!sLogs.length){return}    
  const messagesEmbed = new Discord.MessageEmbed()
  .setDescription(`\`\`\`${sLogs.join('\r\n')}\`\`\``) 
  messagesEmbed.setColor('0x2f3136')
  client.channels.cache.get(`880218361529770014`).send(messagesEmbed);

  sLogs = []
}, 1000); //How often should we send the message groupings (MS)

client.login(process.env.TOKEN);