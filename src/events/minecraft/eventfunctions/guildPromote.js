import { sendToDiscord } from "../../../../index.js";

export default {
	name: "guildPromote",
	async execute(rank, username, oldRank, newRank) {
		if(!rank) {rank = "";}
		// logger.info(`-----------------------------------------------------\n**${rank} ${username}** was promoted from **${oldRank} to ${newRank}!\n-----------------------------------------------------`);
		sendToDiscord(`-----------------------------------------------------\n**${rank} ${username}** was promoted from ${oldRank} to ${newRank}!\n-----------------------------------------------------`);
	}
};