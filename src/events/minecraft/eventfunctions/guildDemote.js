import { sendToDiscord } from "../../../../index.js";

export default {
	name: "guildDemote",
	async execute(rank, username, oldRank, newRank) {
		if(!rank) {rank = "";}
		sendToDiscord(`-----------------------------------------------------\n**${rank} ${username}** was demoted from ${oldRank} to ${newRank}!\n-----------------------------------------------------`);
	}
};