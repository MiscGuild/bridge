const index = require("../../../index.js");
const client = index.client;
const staffChannelID = process.env.STAFFCHANNELID;
const serverID = process.env.SERVERID;

const msPerUnit = { "s": 1000, "m": 60000, "h": 3600000, "d": 86400000 };

module.exports = {
	name: "guildMute",
	async execute(staffRank, staffUsername, mutedRank, mutedUsername, time, timeMultiplier) {
		const serverMembers = client.guilds.cache.get(serverID).members.cache;
		const matchedMember = serverMembers.findKey(user => user.displayName.split(" ")[0] === mutedUsername);

		if(!staffRank) {staffRank = "";}
		if(!mutedRank) {mutedRank = "";}
		client.channels.cache.get(staffChannelID).send(`-----------------------------------------------------\n**${staffRank} ${staffUsername}** has muted **${mutedRank} ${mutedUsername}** for **${time}${timeMultiplier}**\n-----------------------------------------------------`);

		if (matchedMember) {
			time = time * msPerUnit[timeMultiplier];
			
			serverMembers.get(matchedMember).roles.add("849100433317298207");
			setTimeout(function() {
				if (serverMembers.get(matchedMember).roles.cache.some(role => role.id === "849100433317298207") == true) {
					serverMembers.get(matchedMember).roles.remove("849100433317298207");
				}
			}, time);
		}
	}
};