const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guildLeftGame",
    async execute(username){
        // logger.info(`${username} left the game.`);
        sendToDiscord(`**${username}** left the game.`);
    }   
}