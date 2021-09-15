const index = require("../../../index.js");
const client = index.client;
const staffChannelID = process.env.STAFFCHANNELID;
const serverID = process.env.SERVERID;

module.exports = {
	name: "guildMute",
	async execute(staffRank, staffUsername, mutedRank, mutedUsername, time, timeMultiplier) {
		let muteTime;
		if(!staffRank) {staffRank = "";}
		if(!mutedRank) {mutedRank = "";}
		client.channels.cache.get(staffChannelID).send(`-----------------------------------------------------\n**${staffRank} ${staffUsername}** has muted **${mutedRank} ${mutedUsername}** for **${time}${timeMultiplier}**\n-----------------------------------------------------`);
		const displayNickname = mutedUsername;
		const serverMembers = client.guilds.cache.get(serverID).members.cache;
        
		const matchedMember = serverMembers.findKey(user => user.displayName.split(" ")[0] === displayNickname);
		if (!matchedMember) {return;}
		serverMembers.get(matchedMember).roles.add("849100433317298207");
		if (timeMultiplier == "s") {muteTime = time * 1000;}
		else if (timeMultiplier == "m") {muteTime = time * 60000;}
		else if (timeMultiplier == "h") {muteTime = time * 3600000;}
		else if (timeMultiplier == "d") {muteTime = time * 86400000;}
		setTimeout(function() {
			if (serverMembers.get(matchedMember).roles.cache.some(role => role.id === "849100433317298207") == true) {
				serverMembers.get(matchedMember).roles.remove("849100433317298207");
			}
		}, muteTime);
	}
};