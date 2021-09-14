const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guild_promote",
    async execute(guild_promote_rank, guild_promote_username, guild_promote_oldRank, guild_promote_newRank){
        if(!guild_promote_rank){guild_promote_rank = ''}
        // logger.info(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from **${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`);
        sendToDiscord(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from ${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`);
    }
}