const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guild_demote",
    async execute(guild_demote_rank, guild_demote_username, guild_demote_oldRank, guild_demote_newRank){
        if(!guild_demote_rank){guild_demote_rank = ''}
        // logger.info(`-----------------------------------------------------\n**${guild_demote_rank} ${guild_demote_username}** was promoted from **${guild_demote_oldRank} to ${guild_demote_newRank}!\n-----------------------------------------------------`);
        sendToDiscord(`-----------------------------------------------------\n**${guild_demote_rank} ${guild_demote_username}** was demoted from ${guild_demote_oldRank} to ${guild_demote_newRank}!\n-----------------------------------------------------`);
    }
}