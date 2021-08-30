const index = require("./../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guild_joined_game",
    async execute(guild_joined_game_name){
        sendToDiscord(`Welcome back, **${guild_joined_game_name}**!`);
    }
}