const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guildKick",
    async execute(userRank, username, staffRank, staffUsername){
        if(!userRank){userRank = ''}
        if(!staffRank){userRank = ''}
        // logger.info(`-----------------------------------------------------\n**${userRank} ${username}** was kicked from the guild by **${staffRank} ${staffUsername}**\n-----------------------------------------------------`);
        sendToDiscord(`-----------------------------------------------------\n**${userRank} ${username}** was kicked from the guild by **${staffRank} ${staffUsername}**\n-----------------------------------------------------`);
    }
}