

  // Load discord
  const Discord = require('discord.js')
  const client = new Discord.Client({autoReconnect:true})
  const serverID = "522586672148381726";
  var channelID = '843517258755866664'
  var staffChannel = '842912638815043614'
  const fetch = require('node-fetch');
  var log4js = require('log4js');
  var crypto = require("crypto");
  const dotenv = require('dotenv');
  const { setTimeout } = require('timers');
  dotenv.config();
  const fs = require('fs');
  const blacklist = require('./blacklist.json');

  var HypixelAPIKey = process.env.HypixelAPIKey

  var options = {
    host: process.env.IP,
    port: process.env.PORT,
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
    version: '1.16.5'
  }

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
        maxLogSize: 5242880,
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

    }
  });



  var prefix = ')'
  const logger = log4js.getLogger("logs");


  
  client.on('ready', () => {
    logger.info(`The discord bot logged in! Username: ${client.user.username}!`)
    var channel = client.channels.cache.get(channelID)
    if (!channel) {
      logger.info(`I could not find the channel (${channelID})! -- 2`)
      process.exit(1)
    }
  

  // Load mineflayer
  const mineflayer = require('mineflayer')
  const mineflayerViewer = require('prismarine-viewer').mineflayer
  var bot = mineflayer.createBot(options); //create bot object


  bindEvents(bot);
  
  function init(options) 
  {
    var bot = mineflayer.createBot(options);
    bindEvents(bot);
  }
  
  function bindEvents(bot) {
    
    bot.on('error', function(err) { // if the bot errors or crashes i made a function cause cool
        console.log('Error attempting to reconnect: ' + err + '.');
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

  
  
    // function relog() { // relogs #COOL
    //   console.log("Attempting to reconnect...");
    //   channel.send(`*Shutting down for reconnect...*`);
    //   setTimeout(function(){ 
    //     console.log('Shutting down for automatic relog')    
    //     channel.send('**SHUTTING DOWN FOR RELOG**')  
    //     process.exit()
    //   }, 45000);    }
  }

  var messages = [];
  var colour = [];


  bot.once('spawn', () => {

    logger.info('Bot logged in!')
    // mineflayerViewer(bot, { port: 30271 })
    setTimeout(function(){
      bot.chat('/hub')
      setTimeout (function(){
        for (var i = 0; i<15; i++) {bot.chat('/PLSSENDMETOLIMBO')}
      },5000)
      bot.chat('/chat g')
    }, 3000000);

    const loggedInEmbed = new Discord.MessageEmbed()
    .setDescription(`**MiscellaneousBot** has logged onto \`${process.env.IP}\` and is now ready!`)
    .setColor('0x2f3136')
      channel.send(loggedInEmbed)
      const VIP1 = client.emojis.cache.get("843335876872110100");
      const VIP2 = client.emojis.cache.get("843335910287736842");
      const VIP3 = client.emojis.cache.get("843335946699014145");
    
      const VIPPLUS1 = client.emojis.cache.get("843336884435550228");
      const VIPPLUS2 = client.emojis.cache.get("843336948528840725");
      const VIPPLUS3 = client.emojis.cache.get("843337005652115456");
    
      const MVP1 = client.emojis.cache.get("843338152655847444");
      const MVP2 = client.emojis.cache.get("843338190433943663");
      const MVP3 = client.emojis.cache.get("843338213111758899");
    
      const MVPPLUS1 = client.emojis.cache.get("843337813302312962");
      const MVPPLUS2 = client.emojis.cache.get("843337853181231114");
      const MVPPLUS3 = client.emojis.cache.get("843337885985800233");
      const MVPPLUS4 = client.emojis.cache.get("843337919564873758");
    
      const MVPPLUSPLUS1 = client.emojis.cache.get("843338459841691649");
      const MVPPLUSPLUS2 = client.emojis.cache.get("843338505379250187");
      const MVPPLUSPLUS3 = client.emojis.cache.get("843338582889463808");
      const MVPPLUSPLUS4 = client.emojis.cache.get("843338615333191700");
  
      // g ranks
      const MISC1 = client.emojis.cache.get("843900141064552488");
      const MISC2 = client.emojis.cache.get("843900141017759774");
      const MISC3 = client.emojis.cache.get("843900141207027712");
  
      const ACTIVE1 = client.emojis.cache.get("843900080628039725");
      const ACTIVE2 = client.emojis.cache.get("843900080901718056");
      const ACTIVE3 = client.emojis.cache.get("843900080713236493");
      const ACTIVE4 = client.emojis.cache.get("843900080922165348");
  
      const RES1 = client.emojis.cache.get("843900184840110091");
      const RES2 = client.emojis.cache.get("843900184714936351");
      const RES3 = client.emojis.cache.get("843900185079709696");
  
      const GM1 = client.emojis.cache.get("843900121003327508");
      const GM2 = client.emojis.cache.get("843900120901746689");
  
      const ADMIN1 = client.emojis.cache.get("843900103601291344");
      const ADMIN2 = client.emojis.cache.get("843901734920388659");
      const ADMIN3 = client.emojis.cache.get("843901735097204806");
      const ADMIN4 = client.emojis.cache.get("843901735068237824");
  
      const OFFICER1 = client.emojis.cache.get("843900165937037372");
      const OFFICER2 = client.emojis.cache.get("843900165748555796");
  
  
  // + COLOURS
          const RED_MVP_PLUS = client.emojis.cache.get("844352407902617650");
          const PINK_MVP_PLUS_PLUS_1 = client.emojis.cache.get("844352250469941258");
          const PINK_MVP_PLUS_PLUS_2 = client.emojis.cache.get("844352250440056892");
          const BLACK_MVP_PLUS = client.emojis.cache.get("844350093431013447");
          const BLACK_MVP_PLUS_PLUS_1 = client.emojis.cache.get("844350093507035136");
          const BLACK_MVP_PLUS_PLUS_2 = client.emojis.cache.get("844350093472956416");
          const BLUE_MVP_PLUS = client.emojis.cache.get("844350320565682246");
          const BLUE_MVP_PLUS_PLUS_1 = client.emojis.cache.get("844350320645767168");
          const BLUE_MVP_PLUS_PLUS_2 = client.emojis.cache.get("844350320355049495");
          const DARK_AQUA_MVP_PLUS = client.emojis.cache.get("844350604436045834");
          const DARK_AQUA_MVP_PLUS_PLUS_1 = client.emojis.cache.get("844350604549160980");
          const DARK_AQUA_MVP_PLUS_PLUS_2 = client.emojis.cache.get("844350604464750622");
          const DARK_PURPLE_MVP_PLUS = client.emojis.cache.get("844351554970452048");
          const DARK_PURPLE_MVP_PLUS_PLUS_2 = client.emojis.cache.get("844351554945548338");
          const DARK_PURPLE_MVP_PLUS_PLUS_1 = client.emojis.cache.get("844351555037429760");
          const DARK_RED_MVP_PLUS = client.emojis.cache.get("844351667339395092");
          const DARK_RED_MVP_PLUS_PLUS_2 = client.emojis.cache.get("844351667343196211");
          const DARK_RED_MVP_PLUS_PLUS_1 = client.emojis.cache.get("844351667418955796");
          const GOLD_MVP_PLUS = client.emojis.cache.get("844351835224801290");
          const GOLD_MVP_PLUS_PLUS_1 = client.emojis.cache.get("844351834994901043");
          const GOLD_MVP_PLUS_PLUS_2 = client.emojis.cache.get("844351834872479815");
          const GREEN_MVP_PLUS = client.emojis.cache.get("844352013751025664");
          const GREEN_MVP_PLUS_PLUS_1 = client.emojis.cache.get("844352013479182377");
          const GREEN_MVP_PLUS_PLUS_2 = client.emojis.cache.get("844352013759414304");
          const RED_MVP_PLUS_PLUS_1 = client.emojis.cache.get("844352407885709322");
          const RED_MVP_PLUS_PLUS_2 = client.emojis.cache.get("844352407924506654");
  
          const DARK_GREEN_MVP_PLUS = client.emojis.cache.get("844350756214538280");
          const DARK_GREEN_MVP_PLUS_PLUS_1 = client.emojis.cache.get("844350756290166804");
          const DARK_GREEN_MVP_PLUS_PLUS_2 = client.emojis.cache.get("844350756366843945");
  
  
          const WHITE_MVP_PLUS = client.emojis.cache.get("844352509103702027");
          const WHITE_MVP_PLUS_PLUS_1 = client.emojis.cache.get("844352509355098142");
          const WHITE_MVP_PLUS_PLUS_2 = client.emojis.cache.get("844352509388390420");
          const YELLOW_MVP_PLUS = client.emojis.cache.get("844352595828801566");
          const YELLOW_MVP_PLUS_PLUS_2 = client.emojis.cache.get("844352595631013890");
          const YELLOW_MVP_PLUS_PLUS_1 = client.emojis.cache.get("844352595791314944");
      setTimeout (function(){
        for (var i = 0; i<15; i++) {bot.chat('/PLSSENDMETOLIMBO')}
      },5000)
      bot.chat('/chat g')

       
      bot.chatAddPattern(
        /^Guild > (\[.+?\])? ?([A-Za-z0-9_]{3,16}) (\[.+\]): (.+)/,
        'guild_chat',
        'Custom Guild Chat Setup'
      )
      const guild_chat = (rank_guild_chat, username_guild_chat, tag_guild_chat, message_guild_chat) => {
        if(tag_guild_chat == '[MISC]'){var tag_chat_emojis = `${MISC1}${MISC2}${MISC3}`}
        else if(tag_guild_chat == '[Active]'){var tag_chat_emojis = `${ACTIVE1}${ACTIVE2}${ACTIVE3}${ACTIVE4}`}
        else if(tag_guild_chat == '[Res]'){var tag_chat_emojis = `${RES1}${RES2}${RES3}`}
        else if(tag_guild_chat == '[GM]'){var tag_chat_emojis = `${GM1}${GM2}`}
        else if(tag_guild_chat == '[Admin]'){var tag_chat_emojis = `${ADMIN1}${ADMIN2}${ADMIN3}${ADMIN4}`}
        else if(tag_guild_chat == '[O]'){var tag_chat_emojis = `\u200D    ${MVPPLUSPLUS1}${MVPPLUSPLUS2}${MVPPLUSPLUS3}${MVPPLUSPLUS4}`}
        
        if(!rank_guild_chat){
          var rankChat_Emoji = ''
          colour.push('0xAAAAAA')
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
        else if(rank_guild_chat == '[MVP+]'){
          var rankChat_Emoji = `${MVPPLUS1}${MVPPLUS2}${MVPPLUS3}${MVPPLUS4}`
          colour.push('0x55FFFF')
        }
        else if(rank_guild_chat == '[MVP++]'){
          var rankChat_Emoji = `\u200D    ${MVPPLUSPLUS1}${MVPPLUSPLUS2}${MVPPLUSPLUS3}${MVPPLUSPLUS4}`
          colour.push('0xFFAA00')
        }
        return messages.push(`${rankChat_Emoji} **${username_guild_chat}** ${tag_chat_emojis}: ${message_guild_chat}`)

      //   if(rank_guild_chat == '[MVP++]'){
      //   try {
      //   async function GetPlusColourMVP_Plus_plus() {
      //     var MinecraftAPI = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username_guild_chat}`)
      //     .then(res => res.json())
      //     if(!MinecraftAPI.id){return client.channels.cache.get(`523743721443950612`).send(`Error with Getting ${username_guild_chat}'s info from MojangAPI:  \n\`${MinecraftAPI}\` <@484411714637529088>`)}
      //     if(MinecraftAPI.error){return client.channels.cache.get(`523743721443950612`).send(`Error with Getting ${username_guild_chat}'s info from MojangAPI: \n\`${MinecraftAPI.error} | ${MinecraftAPI.errorMessage} \` <@484411714637529088>`)}
           
      //     await fetch(`https://api.hypixel.net/player?key=${HypixelAPIKey}&uuid=${MinecraftAPI.id}`)
      //     .then(res => res.json())
      //     .then(data => {
      //         if(!data.success) {return client.channels.cache.get(`523743721443950612`).send(`Error with Getting ${username_guild_chat}'s info from HypixelAPI: \n\`${data.cause}\` <@484411714637529088>`)}
      //         if(!data.player) {return client.channels.cache.get(`523743721443950612`).send(`Error with Getting ${username_guild_chat}'s info from HypixelAPI: \n\`${data.player}\` -- No player?? <@484411714637529088>`)}
      //         console.log(data.player.rankPlusColor)

      //       if(data.player.rankPlusColor == 'RED'){rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${RED_MVP_PLUS_PLUS_1}${RED_MVP_PLUS_PLUS_2}`}
      //       if(data.player.rankPlusColor == 'GOLD'){rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${GOLD_MVP_PLUS_PLUS_1}${GOLD_MVP_PLUS_PLUS_2}`}
      //       if(data.player.rankPlusColor == 'GREEN'){rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${GREEN_MVP_PLUS_PLUS_1}${GREEN_MVP_PLUS_PLUS_2}`}
      //       if(data.player.rankPlusColor == 'YELLOW'){rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${YELLOW_MVP_PLUS_PLUS_1}${YELLOW_MVP_PLUS_PLUS_2}`}
      //       if(data.player.rankPlusColor == 'LIGHT_PURPLE'){rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${PINK_MVP_PLUS_PLUS_1}${PINK_MVP_PLUS_PLUS_2}`}
      //       if(data.player.rankPlusColor == 'WHITE'){rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${WHITE_MVP_PLUS_PLUS_1}${WHITE_MVP_PLUS_PLUS_2}`}
      //       if(data.player.rankPlusColor == 'BLUE'){rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${BLUE_MVP_PLUS_PLUS_1}${BLUE_MVP_PLUS_PLUS_2}`}
      //       if(data.player.rankPlusColor == 'DARK_GREEN'){rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${DARK_GREEN_MVP_PLUS_PLUS_1}${DARK_GREEN_MVP_PLUS_PLUS_2}`}
      //       if(data.player.rankPlusColor == 'DARK_RED'){rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${DARK_RED_MVP_PLUS_PLUS_1}${DARK_RED_MVP_PLUS_PLUS_2}`}
      //       if(data.player.rankPlusColor == 'DARK_AQUA'){rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${DARK_AQUA_MVP_PLUS_PLUS_1}${DARK_AQUA_MVP_PLUS_PLUS_2}`}
      //       if(data.player.rankPlusColor == 'DARK_PURPLE'){rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${DARK_PURPLE_MVP_PLUS_PLUS_1}${DARK_PURPLE_MVP_PLUS_PLUS_2}`}
      //       if(data.player.rankPlusColor == 'DARK_GRAY'){rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${DARK_GRAY_MVP_PLUS_PLUS_1}${DARK_GRAY_MVP_PLUS_PLUS_2}`}
      //       if(data.player.rankPlusColor == 'BLACK'){rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${BLACK_MVP_PLUS_PLUS_1}${BLACK_MVP_PLUS_PLUS_2}`}




      //     }) 
      //     colour.push('0xFFAA00')
      //     return messages.push(`${rankChat_Emoji} **${username_guild_chat}** ${tag_chat_emojis}: ${message_guild_chat}`)
      //     }
  
      //     GetPlusColourMVP_Plus_plus()

      // } catch(e) {
      //   console.log("Err: " + err);
      // }
      // }
    }
  

      bot.chatAddPattern(
        /^Officer > (\[.+?\])? ?([A-Za-z0-9_]{3,16}) (\[.+\]): (.+)/,
        'officer_chat',
        'Custom Officer guild Chat Setup'
      )
      const officer_chat = (rank_officer_chat, username_officer_chat, officer_chat_tag, message_officer_chat) => {
        if(!rank_officer_chat){var rank_officer_chat_emoji = ''}


        
        if(rank_officer_chat == '[VIP]'){var rank_officer_chat_emoji = `\u200D  ${VIP1}${VIP2}${VIP3}`}
        else if(rank_officer_chat == '[VIP+]'){var rank_officer_chat_emoji = `\u200D     ${VIPPLUS1}${VIPPLUS2}${VIPPLUS3}`}
        else if(rank_officer_chat == '[MVP]'){var rank_officer_chat_emoji = `\u200D   ${MVP1}${MVP2}${MVP3}`}
        else if(rank_officer_chat == '[MVP+]'){var rank_officer_chat_emoji = `${MVPPLUS1}${MVPPLUS2}${MVPPLUS3}${MVPPLUS4}`}
        else if(rank_officer_chat == '[MVP++]'){var rank_officer_chat_emoji = `\u200D    ${MVPPLUSPLUS1}${MVPPLUSPLUS2}${MVPPLUSPLUS3}${MVPPLUSPLUS4}`}

        // logger.info(`OFFICER > ${rank_guild_chat} ${username_guild_chat}: ${message_guild_chat}`)
        client.channels.cache.get(staffChannel).send(`${rank_officer_chat_emoji} **${username_officer_chat}** ${officer_chat_tag}: ${message_officer_chat}`)
      }

      bot.chatAddPattern(
        /^(\[.+?\])? ?([A-Za-z0-9_]{3,16}) was kicked from the guild by (\[.+?\])? ?([A-Za-z0-9_]{3,16})!/,
        'guild_kick',
        'Guild Kick Setup'
      )

      const guild_kick = (Rank1_guild_kick, username1_guild_kick, Rank2_guild_kick, username2_guild_kick) => {
        if(!Rank1_guild_kick){var Rank1_guild_kick = ''}
        if(!Rank2_guild_kick){var Rank1_guild_kick = ''}
        // logger.info(`-----------------------------------------------------\n**${Rank1_guild_kick} ${username1_guild_kick}** was kicked from the guild by **${Rank2_guild_kick} ${username2_guild_kick}**\n-----------------------------------------------------`)
        messages.push(`-----------------------------------------------------\n**${Rank1_guild_kick} ${username1_guild_kick}** was kicked from the guild by **${Rank2_guild_kick} ${username2_guild_kick}**\n-----------------------------------------------------`)
      }

      bot.chatAddPattern(
        /^(\[.+?\])? ?([A-Za-z0-9_]{3,16}) joined the guild!/,
        'guild_join',
        'Guild Join Setup'
      )

      async function checkIfUserBlacklisted(user){
        const MojangAPI = await fetch(`https://api.ashcon.app/mojang/v2/user/${user}`)
        .then(res => res.json())
        for(var i in blacklist){
          if(blacklist[i].uuid == MojangAPI.uuid)
        if(blacklist[i].uuid == MojangAPI.uuid){
          var randomID = crypto.randomBytes(7).toString('hex');
          bot.chat(`/g kick ${user} You have been blacklisted from the guild, Mistake? --> (discord.gg/dEsfnJkQcq) | ${randomID}`)
        }
      }
    }

      const guild_join = (Rank_guild_join, username_guild_join) => {
        if(!Rank_guild_join){var Rank_guild_join = ''}
        messages.push(`-----------------------------------------------------\n**${Rank_guild_join} ${username_guild_join}** joined the guild!\n-----------------------------------------------------`)
        // logger.info(`-----------------------------------------------------\n**${Rank_guild_join} ${username_guild_join}** joined the guild!\n-----------------------------------------------------`)

        setTimeout(() => {
          var randomID = crypto.randomBytes(7).toString('hex');
          bot.chat(`Welcome to the guild, ${username_guild_join}! Make sure you join the discord with /g discord | ${randomID}`)
        }, 6000);
        checkIfUserBlacklisted(username_guild_join)
      }




      bot.chatAddPattern(
        /^(\[.+?\])? ?([A-Za-z0-9_]{3,16}) left the guild!/,
        'guild_leave',
        'Guild leave Setup'
      )


      const guild_leave = (Rank_guild_leave, username_guild_leave) => {
        if(!Rank_guild_leave){var Rank_guild_leave = ''}
        // logger.info(`-----------------------------------------------------\n**${Rank_guild_leave} ${username_guild_leave}** left the guild!\n-----------------------------------------------------`)
        messages.push(`-----------------------------------------------------\n**${Rank_guild_leave} ${username_guild_leave}** left the guild!\n-----------------------------------------------------`)
      }

      bot.chatAddPattern(
        /(\[.+?\])? ?([A-Za-z0-9_]{3,16}) was promoted from (.+) to (.+)/,
        'guild_promote',
        'Guild promote Setup'
      )


      const guild_promote = (guild_promote_rank, guild_promote_username, guild_promote_oldRank, guild_promote_newRank) => {
        if(!guild_promote_rank){var guild_promote_rank = ''}
        // logger.info(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from **${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`)
        messages.push(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from ${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`)
      }

      bot.chatAddPattern(
        /(\[.+?\])? ?([A-Za-z0-9_]{3,16}) was demoted from (.+) to (.+)/,
        'guild_demote',
        'Guild demote Setup'
      )


      const guild_demote = (guild_demote_rank, guild_demote_username, guild_demote_oldRank, guild_demote_newRank) => {
        if(!guild_demote_rank){var guild_demote_rank = ''}
        // logger.info(`-----------------------------------------------------\n**${guild_demote_rank} ${guild_demote_username}** was promoted from **${guild_demote_oldRank} to ${guild_demote_newRank}!\n-----------------------------------------------------`)
        messages.push(`-----------------------------------------------------\n**${guild_demote_rank} ${guild_demote_username}** was demoted from ${guild_demote_oldRank} to ${guild_demote_newRank}!\n-----------------------------------------------------`)
      }



      bot.chatAddPattern(
        /(\[.+?\])? ?([A-Za-z0-9_]{3,16}) has requested to join the Guild!/,
        'guild_requesting',
        'Guild requesting Setup'
      )


      const guild_requesting = (guild_requesting_rank, guild_requesting_username) => {
        if(!guild_requesting_rank){var guild_requesting_rank = ''}
        // logger.info(`-----------------------------------------------------\n**${guild_requesting_rank} ${guild_requesting_username}** is requesting to join the guild! \nA staff member can do \`)command g accept ${guild_requesting_username}\`\n-----------------------------------------------------`)
        messages.push(`-----------------------------------------------------\n**${guild_requesting_rank} ${guild_requesting_username}** is requesting to join the guild! \nA staff member can do \`)command g accept ${guild_requesting_username}\`\n-----------------------------------------------------`)
      }

      bot.chatAddPattern(
        /^Guild > ([A-Za-z0-9_]{3,16}) left\./,
        'guild_left_game',
        'Guild left game Setup'
      )


      const guild_left_game = (guild_left_game_name) => {
        // logger.info(`${guild_left_game_name} left the game.`)
        messages.push(`${guild_left_game_name} left the game.`)
        colour.push('0x2f3136')
      }      
      
      bot.chatAddPattern(
        /^Guild > ([A-Za-z0-9_]{3,16}) joined\./,
        'guild_joined_game',
        'Guild joined game Setup'
      )
      
      const guild_joined_game = (guild_joined_game_name) => {
        messages.push(`Welcome back, **${guild_joined_game_name}**!`)
        colour.push('0x2f3136')
      }
      
      bot.chatAddPattern(
        /^(\[.+?\])? ?([A-Za-z0-9_]{3,16}) has muted (\[.+?\])? ?([A-Za-z0-9_]{3,16}) for (\d*)([a-z])/,
        'guild_mute',
        'Guild mute Setup'
      )
      
      const guild_mute = (guild_mute_rank_staff, guild_mute_staff, guild_mute_rank_username, guild_mute_username, guild_mute_time, guild_mute_type) => {
        if(!guild_mute_rank_staff){var guild_mute_rank_staff = ''}
        if(!guild_mute_rank_username){var guild_mute_rank_username = ''}
        client.channels.cache.get(staffChannel).send(`-----------------------------------------------------\n**${guild_mute_rank_staff} ${guild_mute_staff}** has muted **${guild_mute_rank_username} ${guild_mute_username}** for **${guild_mute_time}${guild_mute_type}**\n-----------------------------------------------------`)
        let displayNickname = guild_mute_username;
        let serverMembers = client.guilds.cache.get(serverID).members.cache;
        
        let matchedMember = serverMembers.findKey(user => user.displayName == displayNickname);
        if (!matchedMember) {return}
        var mute_time;
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
      
      bot.chatAddPattern(
        /^(\[.+?\])? ?([A-Za-z0-9_]{3,16}) has unmuted (\[.+?\])? ?([A-Za-z0-9_]{3,16})/,
        'guild_unmute',
        'Guild unmute Setup'
      )
      
      const guild_unmute = (guild_unmute_rank_staff, guild_unmute_staff, guild_unmute_rank_username, guild_unmute_username) => {
        if(!guild_unmute_rank_staff){var guild_unmute_rank_staff = ''}
        if(!guild_unmute_rank_username){var guild_unmute_rank_username = ''}
        client.channels.cache.get(staffChannel).send(`-----------------------------------------------------\n**${guild_unmute_rank_staff} ${guild_unmute_staff}** has unmuted **${guild_unmute_rank_username} ${guild_unmute_username}**\n-----------------------------------------------------`)
        let serverID = "522586672148381726";
        let displayNickname = guild_unmute_username;
        let serverMembers = client.guilds.cache.get(serverID).members
        let matchedMember = serverMembers.cache.find(m => m.displayName === displayNickname);
        if (!matchedMember) {return}
        if (serverMembers.get(matchedMember).roles.cache.some(role => role.id === '849100433317298207')==true) {
          serverMembers.get(matchedMember).roles.remove('849100433317298207');
        } 
      }


      bot.chatAddPattern(
        /^From (?:\[.+?\])? ?([A-Za-z0-9_]{3,16}): (.+)/,
        'msg_bot',
        'bot msg in game Setup'
      )
      
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
  

      bot.on('guild_chat', guild_chat)
      bot.on('guild_kick', guild_kick)
      bot.on('guild_join', guild_join)
      bot.on('guild_leave', guild_leave)
      bot.on('guild_promote', guild_promote)
      bot.on('guild_demote', guild_demote)
      bot.on('guild_requesting', guild_requesting)
      bot.on('guild_joined_game', guild_joined_game)
      // bot.on('guild_left_game', guild_left_game)
      bot.on('officer_chat', officer_chat)
      bot.on('msg_bot', msg_bot)
      bot.on('guild_mute', guild_mute)
      bot.on('guild_unmute', guild_unmute)


      const McChatLogger = log4js.getLogger("McChatLogs");
           bot.on('message', message => {
            var msg = message.toString()
            if(msg == 'Unknown command. Type "help" for help.'){return}
            if(msg == 'A kick occurred in your connection, so you have been routed to limbo!'){return}
            if(msg == 'disconnect.spam'){return}
            if(msg == 'You were spawned in Limbo.'){return}
            if(msg == '/limbo for more information.'){return}

            McChatLogger.info(msg)
            logger.info(msg)

           })

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
    bot.chat(`/gc [${user.displayName}] - ${message.content}`)
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
    bot.chat(`/oc [${user.displayName}] -  ${message.content}`)
    McChatLogger.info(`DISCORD (OFFICER CHAT)> [${message.author.tag}/${message.author.id}]: ${message.content}`)
    message.delete()
  }
  });

  if(client){


  client.on('message', message => {


    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'chat'.toLowerCase()) {
      if (message.member.roles.cache.some(role => role.name === 'Officer')) {
          var user = message.guild.member(message.member)

          if (!args.length) {
          return message.channel.send(`u need to tell me what to send!`);
        }
        return bot.chat(`[${user.displayName}]: ${args.join(" ").toString()}`)
      } else {return message.channel.send({embed: {
        color: 0x2f3136,
        title: "Error",
        description: `It seems you are lacking the permission to run this command.`,
      }})}
      }

      else if (command === 'command'.toLowerCase()) {
        if (message.member.roles.cache.some(role => role.name === 'Officer')) {
          var user = message.guild.member(message.member)

          if (!args.length) {
            return message.channel.send(`u need to tell me what to send!`);
          }
          if(args[1] == 'kick'.toLowerCase()){return bot.chat(`/${args.join(" ").toString()} [Kicker: ${user.displayName}]`)}
          if(args[0] == 'oc'.toLowerCase()){  
                if(!args[1]){return message.channel.send(' empty msg ')}
            return bot.chat(`/oc [${user.displayName}] ${args.join(" ").toString().replace('oc', '')}`)}

          return bot.chat(`/${args.join(" ").toString()}`)
          message.react('✅')
        } else {return message.channel.send({embed: {
          color: 0x2f3136,
          title: "Error",
          description: `It seems you are lacking the permission to run this command.`,
        }})}
        }

      else if (command === 'reboot'.toLowerCase()) {
        if (message.member.roles.cache.some(role => role.name === 'Officer')) {
          var user = message.guild.member(message.member)

          message.channel.send({embed: {
            color: 0x2f3136,
            title: "Rebooting",
            description: `The bot will restart in \`45s\``,
          }}), logger.info(`Bot will reboot in 45s due to ${user.displayName} running the reboot command`)
          var randomID = crypto.randomBytes(7).toString('hex'); 
          bot.chat(`Bot will reboot in 45s due to ${user.displayName} running the reboot command | ${randomID}`)
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
    if (message.member.roles.cache.some(role => role.name === 'Officer')) {
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


      if(!args[1]){return message.channel.send({embed: {
          color: 0x2f3136,
          title: "Error | Invalid Arguments",
          description: '```'+ prefix +'blacklist <add/remove> <user>\n                        ^^^^^^\nYou must specify a user to add to the blacklist```',
        }});
      }
      if(args[0] == 'add'.toLowerCase()) {
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
          .setThumbnail(`https://visage.surgeplay.com/full/${uuid}`)
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

     if(args[0] == 'remove'.toLowerCase()) {
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
        for(var i in blacklist){

          // if(!blacklist.some(a => a.uuid === MojangAPI.uuid)){
          // return message.channel.send({embed: {
            // color: 0x2f3136,
            // title: "Error",
            // description: `That user appears to not be on the blacklist. To check who is on the blacklist please run the \`${prefix}blacklist\` command`,
          // }})
        // }
         if( blacklist[i].uuid == MojangAPI.uuid){
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
             message.channel.send({embed: {
            color: 0x2f3136,
            title: "Error",
            description: `That user appears to not be on the blacklist. To check who is on the blacklist please run the \`${prefix}blacklist\` command`,
          }})
        })
              
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
     }}
    } else {return message.channel.send({embed: {
      color: 0x2f3136,
      title: "Error",
      description: `It seems you are lacking the permission to run this command.`,
    }})
   } 
  }
  })}})
  })
      client.login(process.env.TOKEN)
  


