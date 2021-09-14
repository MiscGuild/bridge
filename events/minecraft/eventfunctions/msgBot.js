const index = require('../../../index.js');
const bot = index.bot;
const fetch = require('node-fetch');
const crypto = require('crypto');

function gexpFunction(gexpLIST) {
    let sum = 0;
    for (let gexp of Object.values(gexpLIST)) {
        sum += gexp;
    }
    return sum; 
}

module.exports = {
    name: 'msg_bot',
    async execute (msg_bot_username, msg_bot_message){
        async function msg_bot_aysnc() {
            let randomID = crypto.randomBytes(7).toString('hex');
            HypixelAPIKey = process.env.HypixelAPIKey;
            if(msg_bot_message.startsWith('weeklygexp'||'weeklygxp')){

            let minecraftAPI = await fetch(`https://api.mojang.com/users/profiles/minecraft/${msg_bot_username}`)
            .then(res => res.json())
            fetch(`https://api.hypixel.net/guild?key=${HypixelAPIKey}&player=${minecraftAPI.id}`)
            .then(res => res.json())
            .then(data => {
                for (let item in data.guild.members) {
                    if (data.guild.members[item].uuid == minecraftAPI.id) {
                        let gexpLIST = data.guild.members[item].expHistory
                        bot.chat(`/w ${msg_bot_username} ${msg_bot_username}'s total weekly gexp: ${gexpFunction(gexpLIST).toLocaleString()} | ${randomID}`);
                    };
                }
            });
            } 
            else if(msg_bot_message.startsWith('Boop!')) {bot.chat(`/boop ${msg_bot_username}`)}

            else{
                let usernameMention = msg_bot_message.split(" ")[0];
                let validUser = true;
                minecraftAPI = await fetch(`https://api.mojang.com/users/profiles/minecraft/${usernameMention}`)
                .then(res => { 
                    if (res.status == 200) {
                        return res.json();
                    }
                    else {
                        validUser = false;
                        return bot.chat(`/w ${msg_bot_username} "${usernameMention}" was not found (Try giving me a username and/or check spelling) | ${randomID}`);
                    }
                })
                
                if (validUser){
                    fetch(`https://api.hypixel.net/guild?key=${HypixelAPIKey}&player=${minecraftAPI.id}`)
                    .then(res => {return res.json()})
                    .then(data => {
                        if(!data.guild){
                            return bot.chat(`/w ${msg_bot_username} "${usernameMention}" does not seem to be in a guild | ${randomID} `)}
                        for (let item in data.guild.members) {
                            if (data.guild.members[item].uuid == minecraftAPI.id) {
                                let gexpLIST = data.guild.members[item].expHistory;
                                return bot.chat(`/w ${msg_bot_username} ${minecraftAPI.name}'s total weekly gexp: ${gexpFunction(gexpLIST).toLocaleString()} | ${randomID}`); 
                            };
                        }
                    });
                }
            }
        }
    msg_bot_aysnc()
    }   
}