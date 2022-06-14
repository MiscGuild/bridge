import { client } from "../../../../index.js";
import { staffChannelID, serverID } from "../../../resources/consts.js";

export default {
	name: "guildUnmute",
	async execute(staffRank, staffUsername, unmutedRank, unmutedUsername) {
		const serverMembers = client.guilds.cache.get(serverID).members;
		const matchedMember = serverMembers.cache.find(m => m.displayName === unmutedUsername);

		if(!staffRank) {staffRank = "";}
		if(!unmutedRank) {unmutedRank = "";}
		client.channels.cache.get(staffChannelID).send(`-----------------------------------------------------\n**${staffRank} ${staffUsername}** has unmuted **${unmutedRank} ${unmutedUsername}**\n-----------------------------------------------------`);

		if (matchedMember && serverMembers.get(matchedMember).roles.cache.some(role => role.name === "849100433317298207") == true) {
			serverMembers.get(matchedMember).roles.remove("849100433317298207");
		}
	}
};