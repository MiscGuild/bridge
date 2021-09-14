const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guild_kick",
    async execute(Rank1_guild_kick, username1_guild_kick, Rank2_guild_kick, username2_guild_kick){
        if(!Rank1_guild_kick){Rank1_guild_kick = ''}
        if(!Rank2_guild_kick){Rank1_guild_kick = ''}
        // logger.info(`-----------------------------------------------------\n**${Rank1_guild_kick} ${username1_guild_kick}** was kicked from the guild by **${Rank2_guild_kick} ${username2_guild_kick}**\n-----------------------------------------------------`);
        sendToDiscord(`-----------------------------------------------------\n**${Rank1_guild_kick} ${username1_guild_kick}** was kicked from the guild by **${Rank2_guild_kick} ${username2_guild_kick}**\n-----------------------------------------------------`);
    }
}