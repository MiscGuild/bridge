const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "guildDemote",
    async execute(rank, username, oldRank, newRank){
        if(!rank){rank = ''}
        sendToDiscord(`-----------------------------------------------------\n**${rank} ${username}** was demoted from ${oldRank} to ${newRank}!\n-----------------------------------------------------`);
    }
}