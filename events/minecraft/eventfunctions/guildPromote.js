const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guild_promote",
    async execute(rank, username, oldRank, newRank){
        if(!rank){rank = ''}
        // logger.info(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from **${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`);
        sendToDiscord(`-----------------------------------------------------\n**${rank} ${username}** was promoted from ${oldRank} to ${newRank}!\n-----------------------------------------------------`);
    }
}