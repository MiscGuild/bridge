const index = require('../../../index.js');
const client = index.client;
const staffChannelID = process.env.STAFFCHANNELID;
const serverID = process.env.SERVERID;

module.exports = {
    name: 'guild_mute',
    async execute(staffRank, staffUsername, mutedRank, mutedUsername, time, timeMultiplier){
        let mute_time;
        if(!staffRank){staffRank = ''}
        if(!mutedRank){mutedRank = ''}
        client.channels.cache.get(staffChannelID).send(`-----------------------------------------------------\n**${staffRank} ${staffUsername}** has muted **${mutedRank} ${mutedUsername}** for **${time}${timeMultiplier}**\n-----------------------------------------------------`)
        let displayNickname = mutedUsername;
        let serverMembers = client.guilds.cache.get(serverID).members.cache;
        
        let matchedMember = serverMembers.findKey(user => user.displayName.split(" ")[0] === displayNickname);
        if (!matchedMember) {return}
        serverMembers.get(matchedMember).roles.add('849100433317298207');
        if (timeMultiplier=='s') {mute_time = time*1000}
        else if (timeMultiplier=='m') {mute_time = time*60000}
        else if (timeMultiplier=='h') {mute_time = time*3600000}
        else if (timeMultiplier=='d') {mute_time = time*86400000}
        setTimeout(function() {
            if (serverMembers.get(matchedMember).roles.cache.some(role => role.id === '849100433317298207')==true) {
                serverMembers.get(matchedMember).roles.remove('849100433317298207');
            } 
        }, mute_time)
    }
}