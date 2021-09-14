const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guild_demote",
    async execute(rank, username, oldRank, newRank){
        if(!rank){rank = ''}
        // logger.info(`-----------------------------------------------------\n**${guild_demote_rank} ${guild_demote_username}** was promoted from **${guild_demote_oldRank} to ${guild_demote_newRank}!\n-----------------------------------------------------`);
        sendToDiscord(`-----------------------------------------------------\n**${rank} ${username}** was demoted from ${oldRank} to ${newRank}!\n-----------------------------------------------------`);
    }
}