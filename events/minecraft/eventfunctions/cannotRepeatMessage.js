const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "cannot_say_same_msg_twice",
    async execute(){
        // logger.info(`-----------------------------------------------------\n**${guild_promote_rank} ${guild_promote_username}** was promoted from **${guild_promote_oldRank} to ${guild_promote_newRank}!\n-----------------------------------------------------`);
        sendToDiscord("**Error: ** `You cannot say the same message twice!`");
    }
}