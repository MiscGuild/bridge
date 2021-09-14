const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "comment_blocked",
    async execute(comment, reason){
        // logger.info(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from **${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`);
        sendToDiscord(`**Error: ** \`Your comment, \'${comment}\' was blocked for \'${reason}\'\``);
    }
}