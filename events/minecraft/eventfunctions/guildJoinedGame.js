const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guild_joined_game",
    async execute(username){
        sendToDiscord(`Welcome back, **${username}**!`);
    }
}