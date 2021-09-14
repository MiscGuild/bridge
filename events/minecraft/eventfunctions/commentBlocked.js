const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "comment_blocked",
    async execute(comment_blocked_comment, comment_blocked_reason){
        // logger.info(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from **${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`);
        sendToDiscord(`**Error: ** \`Your comment, \'${comment_blocked_comment}\' was blocked for \'${comment_blocked_reason}\'\``);
    }
}