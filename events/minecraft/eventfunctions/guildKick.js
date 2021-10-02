import { sendToDiscord } from "../../../index.js";

export default {
	name: "guildKick",
	async execute(userRank, username, staffRank, staffUsername) {
		if(!userRank) {userRank = "";}
		if(!staffRank) {staffRank = "";}
		// logger.info(`-----------------------------------------------------\n**${userRank} ${username}** was kicked from the guild by **${staffRank} ${staffUsername}**\n-----------------------------------------------------`);
		sendToDiscord(`-----------------------------------------------------\n**${userRank} ${username}** was kicked from the guild by **${staffRank} ${staffUsername}**\n-----------------------------------------------------`);
	}
};