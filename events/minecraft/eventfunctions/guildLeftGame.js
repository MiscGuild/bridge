const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guild_left_game",
    async execute(username){
        // logger.info(`${guild_left_game_name} left the game.`);
        sendToDiscord(`**${username}** left the game.`);
    }   
}