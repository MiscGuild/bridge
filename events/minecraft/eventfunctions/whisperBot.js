const index = require('../../../index.js');
const bot = index.bot;
const fetch = require('node-fetch');
const crypto = require('crypto');
const mojangGrabber = require('../../../utilities/mojangGrabber.js');

function gexpFunction(gexpLIST) {
    let sum = 0;
    for (let gexp of Object.values(gexpLIST)) {
        sum += gexp;
    }
    return sum; 
}

module.exports = {
    name: 'whisperBot',
    async execute (username, message){
        async function msgBot() {
            let randomID = crypto.randomBytes(7).toString('hex');
            let HypixelAPIKey = process.env.HypixelAPIKey;
            
            if(message.startsWith('weeklygexp'||'weeklygxp')){
                let mojangAPI = await mojangGrabber(username);
                fetch(`https://api.hypixel.net/guild?key=${HypixelAPIKey}&player=${mojangAPI.id}`)
                .then(res => res.json())
                .then(data => {
                    for (let item in data.guild.members) {
                        if (data.guild.members[item].uuid == mojangAPI.id) {
                            let gexpLIST = data.guild.members[item].expHistory
                            bot.chat(`/w ${username} ${username}'s total weekly gexp: ${gexpFunction(gexpLIST).toLocaleString()} | ${randomID}`);
                        };
                    }
                });
            } 
            else if(message.startsWith('Boop!')) {bot.chat(`/boop ${username}`)}

            else{
                let usernameMention = message.split(" ")[0];
                let validUser = true;
                let mojangAPI = await mojangGrabber(usernameMention);

                if (!mojangAPI) {
                    validUser = false;
                    return bot.chat(`/w ${username} "${usernameMention}" was not found (Try giving me a username and/or check spelling) | ${randomID}`);
                }

                if (validUser){
                    fetch(`https://api.hypixel.net/guild?key=${HypixelAPIKey}&player=${mojangAPI.id}`)
                    .then(res => {return res.json()})
                    .then(data => {
                        if(!data.guild){
                            return bot.chat(`/w ${username} "${usernameMention}" does not seem to be in a guild | ${randomID}`)}
                        for (let item in data.guild.members) {
                            if (data.guild.members[item].uuid == mojangAPI.id) {
                                let gexpLIST = data.guild.members[item].expHistory;
                                return bot.chat(`/w ${username} ${mojangAPI.name}'s total weekly gexp: ${gexpFunction(gexpLIST).toLocaleString()} | ${randomID}`); 
                            };
                        }
                    });
                }
            }
        }
    msgBot()
    }   
}