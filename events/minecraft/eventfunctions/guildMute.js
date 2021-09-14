const index = require('../../../index.js');
const client = index.client;
const staffChannelID = process.env.STAFFCHANNEL;
const serverID = process.env.SERVERID;

module.exports = {
    name: 'guild_mute',
    async execute(guild_mute_rank_staff, guild_mute_staff, guild_mute_rank_username, guild_mute_username, guild_mute_time, guild_mute_type){
        var mute_time;
        if(!guild_mute_rank_staff){var guild_mute_rank_staff = ''}
        if(!guild_mute_rank_username){var guild_mute_rank_username = ''}
        client.channels.cache.get(staffChannelID).send(`-----------------------------------------------------\n**${guild_mute_rank_staff} ${guild_mute_staff}** has muted **${guild_mute_rank_username} ${guild_mute_username}** for **${guild_mute_time}${guild_mute_type}**\n-----------------------------------------------------`)
        let displayNickname = guild_mute_username;
        let serverMembers = client.guilds.cache.get(serverID).members.cache;
        
        let matchedMember = serverMembers.findKey(user => user.displayName.split(" ")[0] === displayNickname);
        if (!matchedMember) {return}
        serverMembers.get(matchedMember).roles.add('849100433317298207');
        if (guild_mute_type=='s') {mute_time = guild_mute_time*1000}
        else if (guild_mute_type=='m') {mute_time = guild_mute_time*60000}
        else if (guild_mute_type=='h') {mute_time = guild_mute_time*3600000}
        else if (guild_mute_type=='d') {mute_time = guild_mute_time*86400000}
        setTimeout(function() {
            if (serverMembers.get(matchedMember).roles.cache.some(role => role.id === '849100433317298207')==true) {
                serverMembers.get(matchedMember).roles.remove('849100433317298207');
            } 
        }, mute_time)
    }
}