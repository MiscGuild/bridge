

  // Load discord
  const Discord = require('discord.js')
  const client = new Discord.Client()
  var channelID = '843517258755866664'
  var staffChannel = '842912638815043614'
  const fetch = require('node-fetch');
  var log4js = require('log4js');
  var crypto = require("crypto");
  const dotenv = require('dotenv');
  dotenv.config();

  var HypixelAPIKey = process.env.HypixelAPIKey

  var options = {
    host: process.env.IP,
    port: process.env.PORT,
    username: process.env.USERNAME,
    password: process.env.PASSWORD
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
  var bot = mineflayer.createBot(options); 


  var bot = mineflayer.createBot(options); // create the bot object cause noob
  bindEvents(bot);
  
  function init(options) 
  {
    var bot = mineflayer.createBot(options);
    bindEvents(bot);
  }
  
  function bindEvents(bot) {
    
    bot.on('error', function(err) { // if the bot errors or crashes i made a function cause cool
        console.log('Error attempting to reconnect: ' + err + '.');
        if (err == undefined) {
            relog(); 
        }
    });
  
    bot.on('end', function() { //Once bot ends do this shit i cba to document code
      channel.send(`***It appears I have been kicked, Attempting to reconnect in 30 seconds***`);
      console.log('I was kicked!')
      // Gotta set it to 31s or else badd
        var waitTill = new Date(new Date().getTime() + 31 * 1000);
        while(waitTill > new Date()){} 
        relog();
    });
  
    bot.on('kicked', function(reason) {
      console.log(reason)
      bot.end();
    });
  
  
    function relog() { // relogs #COOL
      console.log("Attempting to reconnect...");
      channel.send(`*Attempting to reconnect...*`);
      init(options);
    }
  }
  


  var messages = [];
  var colour = [];


  bot.once('spawn', () => {

    logger.info('Bot logged in!')
    mineflayerViewer(bot, { port: 30271 })
    const loggedInEmbed = new Discord.MessageEmbed()
    .setDescription(`**MiscellaneousBot** Has logged onto \`mc.hypixel.net\` and is now ready!`)
    // .setColor(colour)
      channel.send(loggedInEmbed)

    var VIP1 = client.emojis.cache.get("843335876872110100");
    var VIP2 = client.emojis.cache.get("843335910287736842");
    var VIP3 = client.emojis.cache.get("843335946699014145");
  
    var VIPPLUS1 = client.emojis.cache.get("843336884435550228");
    var VIPPLUS2 = client.emojis.cache.get("843336948528840725");
    var VIPPLUS3 = client.emojis.cache.get("843337005652115456");
  
    var MVP1 = client.emojis.cache.get("843338152655847444");
    var MVP2 = client.emojis.cache.get("843338190433943663");
    var MVP3 = client.emojis.cache.get("843338213111758899");
  
    var MVPPLUS1 = client.emojis.cache.get("843337813302312962");
    var MVPPLUS2 = client.emojis.cache.get("843337853181231114");
    var MVPPLUS3 = client.emojis.cache.get("843337885985800233");
    var MVPPLUS4 = client.emojis.cache.get("843337919564873758");
  
    var MVPPLUSPLUS1 = client.emojis.cache.get("843338459841691649");
    var MVPPLUSPLUS2 = client.emojis.cache.get("843338505379250187");
    var MVPPLUSPLUS3 = client.emojis.cache.get("843338582889463808");
    var MVPPLUSPLUS4 = client.emojis.cache.get("843338615333191700");

    // g ranks
    var MISC1 = client.emojis.cache.get("843900141064552488");
    var MISC2 = client.emojis.cache.get("843900141017759774");
    var MISC3 = client.emojis.cache.get("843900141207027712");

    var ACTIVE1 = client.emojis.cache.get("843900080628039725");
    var ACTIVE2 = client.emojis.cache.get("843900080901718056");
    var ACTIVE3 = client.emojis.cache.get("843900080713236493");
    var ACTIVE4 = client.emojis.cache.get("843900080922165348");

    var RES1 = client.emojis.cache.get("843900184840110091");
    var RES2 = client.emojis.cache.get("843900184714936351");
    var RES3 = client.emojis.cache.get("843900185079709696");

    var GM1 = client.emojis.cache.get("843900121003327508");
    var GM2 = client.emojis.cache.get("843900120901746689");

    var ADMIN1 = client.emojis.cache.get("843900103601291344");
    var ADMIN2 = client.emojis.cache.get("843901734920388659");
    var ADMIN3 = client.emojis.cache.get("843901735097204806");
    var ADMIN4 = client.emojis.cache.get("843901735068237824");

    var OFFICER1 = client.emojis.cache.get("843900165937037372");
    var OFFICER2 = client.emojis.cache.get("843900165748555796");



      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/wijfelkcewnrljglf')
      bot.chat('/chat g')


       
      bot.chatAddPattern(
        /^Guild > (\[.+?\])? ?([A-Za-z0-9_]{3,16}) (\[.+\]): (.+)/,
        'guild_chat',
        'Custom Guild Chat Setup'
      )
      const guild_chat = (rank_guild_chat, username_guild_chat, tag_guild_chat, message_guild_chat) => {
        if(!rank_guild_chat){var rankChat_Emoji = ''
        colour.push('0xAAAAAA')
      }

        if(tag_guild_chat == '[MISC]'){var tag_chat_emojis = `${MISC1}${MISC2}${MISC3}`}
        if(tag_guild_chat == '[Active]'){var tag_chat_emojis = `${ACTIVE1}${ACTIVE2}${ACTIVE3}${ACTIVE4}`}
        if(tag_guild_chat == '[Res]'){var tag_chat_emojis = `${RES1}${RES2}${RES3}`}
        if(tag_guild_chat == '[GM]'){var tag_chat_emojis = `${GM1}${GM2}`}
        if(tag_guild_chat == '[Admin]'){var tag_chat_emojis = `${ADMIN1}${ADMIN2}${ADMIN3}${ADMIN4}`}
        if(tag_guild_chat == '[O]'){var tag_chat_emojis = `${OFFICER1}${OFFICER2}`}

        if(rank_guild_chat == '[VIP]'){var rankChat_Emoji = `**  **${VIP1}${VIP2}${VIP3}` 
        colour.push('0x55FF55') }
        if(rank_guild_chat == '[VIP+]'){var rankChat_Emoji = `**     **${VIPPLUS1}${VIPPLUS2}${VIPPLUS3}` 
        colour.push('0x55FF55')}
        if(rank_guild_chat == '[MVP]'){var rankChat_Emoji = `**   **${MVP1}${MVP2}${MVP3}`
        colour.push('0x55FFFF')}
        if(rank_guild_chat == '[MVP+]'){var rankChat_Emoji = `${MVPPLUS1}${MVPPLUS2}${MVPPLUS3}${MVPPLUS4}`
        colour.push('0x55FFFF')}
        if(rank_guild_chat == '[MVP++]'){var rankChat_Emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${MVPPLUSPLUS3}${MVPPLUSPLUS4}`
        colour.push('0xFFAA00')}

        // logger.info(`${rank_guild_chat} ${username_guild_chat} ${tag_guild_chat}: ${message_guild_chat}`)
        messages.push(`${rankChat_Emoji} **${username_guild_chat}** ${tag_chat_emojis}: ${message_guild_chat}`)
      }
  

      bot.chatAddPattern(
        /^Officer > (\[.+?\])? ?([A-Za-z0-9_]{3,16}) (\[.+\]): (.+)/,
        'officer_chat',
        'Custom Officer guild Chat Setup'
      )
      const officer_chat = (rank_officer_chat, username_officer_chat, officer_chat_tag, message_officer_chat) => {
        if(!rank_officer_chat){var rank_officer_chat_emoji = ''}


        
        if(rank_officer_chat == '[VIP]'){var rank_officer_chat_emoji = `**  **${VIP1}${VIP2}${VIP3}`}
        if(rank_officer_chat == '[VIP+]'){var rank_officer_chat_emoji = `**     **${VIPPLUS1}${VIPPLUS2}${VIPPLUS3}`}
        if(rank_officer_chat == '[MVP]'){var rank_officer_chat_emoji = `**   **${MVP1}${MVP2}${MVP3}`}
        if(rank_officer_chat == '[MVP+]'){var rank_officer_chat_emoji = `${MVPPLUS1}${MVPPLUS2}${MVPPLUS3}${MVPPLUS4}`}
        if(rank_officer_chat == '[MVP++]'){var rank_officer_chat_emoji = `**    **${MVPPLUSPLUS1}${MVPPLUSPLUS2}${MVPPLUSPLUS3}${MVPPLUSPLUS4}`}

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

      const guild_join = (Rank_guild_join, username_guild_join) => {
        if(!Rank_guild_join){var Rank_guild_join = ''}
        messages.push(`-----------------------------------------------------\n**${Rank_guild_join} ${username_guild_join}** Joined the guild!\n-----------------------------------------------------`)
        // logger.info(`-----------------------------------------------------\n**${Rank_guild_join} ${username_guild_join}** Joined the guild!\n-----------------------------------------------------`)

        setTimeout(() => {
          var randomID = crypto.randomBytes(5).toString('hex');
          bot.chat(`Welcome to the guild, ${username_guild_join}! Make sure you join the discord with /g discord | ${randomID}`)
        }, 6000);
      }





      bot.chatAddPattern(
        /^(\[.+?\])? ?([A-Za-z0-9_]{3,16}) left the guild!/,
        'guild_leave',
        'Guild leave Setup'
      )


      const guild_leave = (Rank_guild_leave, username_guild_leave) => {
        if(!Rank_guild_leave){var Rank_guild_leave = ''}
        // logger.info(`-----------------------------------------------------\n**${Rank_guild_leave} ${username_guild_leave}** Left the guild!\n-----------------------------------------------------`)
        messages.push(`-----------------------------------------------------\n**${Rank_guild_leave} ${username_guild_leave}** Left the guild!\n-----------------------------------------------------`)
      }

      bot.chatAddPattern(
        /(\[.+?\])? ?([A-Za-z0-9_]{3,16}) was promoted from .+ to .+/,
        'guild_promote',
        'Guild promote Setup'
      )


      const guild_promote = (guild_promote_rank, guild_promote_username, guild_promote_oldRank, guild_promote_newRank) => {
        if(!guild_promote_rank){var guild_promote_rank = ''}
        // logger.info(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from **${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`)
        messages.push(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from **${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`)
      }

      bot.chatAddPattern(
        /(\[.+?\])? ?([A-Za-z0-9_]{3,16}) was demoted from .+ to .+/,
        'guild_demote',
        'Guild demote Setup'
      )


      const guild_demote = (guild_demote_rank, guild_demote_username, guild_demote_oldRank, guild_demote_newRank) => {
        if(!guild_demote_rank){var guild_demote_rank = ''}
        // logger.info(`-----------------------------------------------------\n**${guild_demote_rank} ${guild_demote_username}** was promoted from **${guild_demote_oldRank} to ${guild_demote_newRank}!\n-----------------------------------------------------`)
        messages.push(`-----------------------------------------------------\n**${guild_demote_rank} ${guild_demote_username}** was promoted from **${guild_demote_oldRank} to ${guild_demote_newRank}!\n-----------------------------------------------------`)
      }



      bot.chatAddPattern(
        /(\[.+?\])? ?([A-Za-z0-9_]{3,16}) has requested to join the Guild!/,
        'guild_requesting',
        'Guild requesting Setup'
      )


      const guild_requesting = (guild_requesting_rank, guild_requesting_username) => {
        if(!guild_requesting_rank){var guild_requesting_rank = ''}
        // logger.info(`-----------------------------------------------------\n**${guild_requesting_rank} ${guild_requesting_username}** Is requesting to join the guild! \nA staff member can do \`)command g accept ${guild_requesting_username}\`\n-----------------------------------------------------`)
        messages.push(`-----------------------------------------------------\n**${guild_requesting_rank} ${guild_requesting_username}** Is requesting to join the guild! \nA staff member can do \`)command g accept ${guild_requesting_username}\`\n-----------------------------------------------------`)
      }

      bot.chatAddPattern(
        /^Guild > ([A-Za-z0-9_]{3,16}) left\./,
        'guild_left_game',
        'Guild left game Setup'
      )


      const guild_left_game = (guild_left_game_name) => {
        // logger.info(`${guild_left_game_name} left the game.`)
        messages.push(`${guild_left_game_name} left the game.`)
        colour.push('0x36393F')
      }      
      
      bot.chatAddPattern(
        /^Guild > ([A-Za-z0-9_]{3,16}) joined\./,
        'guild_joined_game',
        'Guild joined game Setup'
      )
      
      const guild_joined_game = (guild_joined_game_name) => {
        messages.push(`Welcome back, **${guild_joined_game_name}**!`)
        colour.push('0x36393F')
      }

      bot.chatAddPattern(
        /^From (?:\[.+?\])? ?([A-Za-z0-9_]{3,16}): (.+)/,
        'msg_bot',
        'bot msg in game Setup'
      )
      
      const msg_bot = (msg_bot_username, msg_bot_message) => {

        async function msg_bot_aysnc() {
          if(msg_bot_message.startsWith('weeklygexp')){
  
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
                    var randomID = crypto.randomBytes(5).toString('hex');
                    bot.chat(`/w ${msg_bot_username} ${msg_bot_username}'s total weekly gexp: ${gexpFunction(gexpLIST).toLocaleString()} | ${randomID}`); // 650

                  };
              }
          });
        }

        else{
          let usernameMention = msg_bot_message.split(" ")[0]
          var randomIDP = crypto.randomBytes(5).toString('hex');

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
                var randomID = crypto.randomBytes(5).toString('hex');
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
    .setColor(colour[Math.floor(Math.random() * colour.length)])
    channel.send(messagesEmbed);

    colour = []
    messages = []
  }, 650); //How often should we send the message groupings (MS)

  client.on('message', message => {
  
    if(message.channel.id == channel){
    if(message.content.startsWith(prefix)){return}
    if(message.author.bot){return}
    if(message.attachments.size > 0){return}
    var user = message.guild.member(message.member)
    if(message.content.length > 250){return message.channel.send(`Your message is too long! ${message.content.length}/250`)}
    bot.chat(`${user.displayName} -> ${message.content}`)
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
    bot.chat(`/oc ${user.displayName} -> ${message.content}`)
      McChatLogger.info(`DISCORD (OFFICER CHAT)> [${message.author.tag}/${message.author.id}]: ${message.content}`)
    message.delete()
  }
  });

  if(client){


  client.on('message', message => {


    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'chat') {
      if (message.member.roles.cache.some(role => role.name === 'Officer')) {
          var user = message.guild.member(message.member)

          if (!args.length) {
          return message.channel.send(`u need to tell me what to send!`);
        }
        return bot.chat(`[${user.displayName}]: ${args.join(" ").toString()}`)
      }
      else { return message.channel.send('no perms')}
      }

      else if (command === 'command') {
        if (message.member.roles.cache.some(role => role.name === 'Officer')) {
          var user = message.guild.member(message.member)

          if (!args.length) {
            return message.channel.send(`u need to tell me what to send!`);
          }
          if(args[1] == 'kick'.toLowerCase()){return bot.chat(`/${args.join(" ").toString()} [Kicker: ${user.displayName}]`)}
          if(args[0] == 'oc'.toLowerCase()){  
                if(!args[1]){return message.channel.send(' empty msg ')}
            return bot.chat(`/oc [${user.displayName}] ${args.join(" ").toString().replace('oc', '')}`)}

        
          //logger.info(message)

          return bot.chat(`/${args.join(" ").toString()}`)
        }
        else { return message.channel.send('no perms')}
        }

  else if (command === 'limbo') {
    if (message.member.roles.cache.some(role => role.name === 'Officer')) {

    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)
    bot.chat(`/PLSSENDMEINTOLIMBOHYPIXELAHHHHH`)

    }
    else { return message.channel.send('no perms')}
    }
  
  })}});
})
      client.login(process.env.TOKEN)


