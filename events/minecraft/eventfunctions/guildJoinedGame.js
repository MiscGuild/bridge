const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guildJoinedGame",
    async execute(username){
        sendToDiscord(`Welcome back, **${username}**!`);
    }
}