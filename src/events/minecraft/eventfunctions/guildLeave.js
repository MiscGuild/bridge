import { sendToDiscord } from "../../../../index.js";

export default {
	name: "guildLeave",
	async execute(rank, username) {
		if (!rank) {
			rank = "";
		}
		// logger.info(`-----------------------------------------------------\n**${rank} ${username}** left the guild!\n-----------------------------------------------------`);
		sendToDiscord(
			`-----------------------------------------------------\n**${rank} ${username}** left the guild!\n-----------------------------------------------------`
		);
	},
};
