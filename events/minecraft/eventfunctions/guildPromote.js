const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guild_promote",
    async execute(rank, username, oldRank, newRank){
        if(!rank){rank = ''}
        // logger.info(`-----------------------------------------------------\n**${rank} ${username}** was promoted from **${oldRank} to ${newRank}!\n-----------------------------------------------------`);
        sendToDiscord(`-----------------------------------------------------\n**${rank} ${username}** was promoted from ${oldRank} to ${newRank}!\n-----------------------------------------------------`);
    }
}