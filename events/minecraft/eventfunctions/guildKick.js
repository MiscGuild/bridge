const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guild_kick",
    async execute(userRank, userName, staffRank, staffUsername){
        if(!userRank){userRank = ''}
        if(!staffRank){userRank = ''}
        // logger.info(`-----------------------------------------------------\n**${Rank1_guild_kick} ${username1_guild_kick}** was kicked from the guild by **${Rank2_guild_kick} ${username2_guild_kick}**\n-----------------------------------------------------`);
        sendToDiscord(`-----------------------------------------------------\n**${userRank} ${userName}** was kicked from the guild by **${staffRank} ${staffUsername}**\n-----------------------------------------------------`);
    }
}