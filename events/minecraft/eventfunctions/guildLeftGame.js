const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guild_left_game",
    async execute(username){
        // logger.info(`${username} left the game.`);
        sendToDiscord(`**${username}** left the game.`);
    }   
}