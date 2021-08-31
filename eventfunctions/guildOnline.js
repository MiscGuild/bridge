const index = require('./../index.js');
const client = index.client;
const fetch = require('node-fetch');

module.exports = { 
    name: 'guild_online',
    async execute (guild_online_members){
        async function SetStatus() {
            const HyAPI = await fetch(`https://api.hypixel.net/playercount?key=${process.env.HypixelAPIKey}`)
            .then(response => response.json())
            .catch(err =>{return console.log(err)})
            if(!HyAPI.playerCount){return client.user.setPresence({ activities: [{ name: `${guild_online_members.toLocaleString()} online Miscellaneous members and ??? players on Hypixel!`, type:"WATCHING" }], status: 'dnd' });

            }

            client.user.setPresence({ activities: [{ name: `${guild_online_members.toLocaleString()} online Miscellaneous members and ${HyAPI.playerCount.toLocaleString()} players on Hypixel!`, type:"WATCHING" }], status: 'dnd' });
        }
     SetStatus()
     client.user.setStatus('dnd');

    }  
}