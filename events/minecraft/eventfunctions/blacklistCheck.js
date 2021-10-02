import { bot } from "../../../index.js";
import checkIfUserBlacklisted from "../../../utilities/checkIfUserBlacklisted.js";

export default {
	name: "blacklistCheck",
	async execute(message) {
		const guildMembers = message.split(" ●  ");
		for (const member of guildMembers) {
			if (await checkIfUserBlacklisted(member)) {
				bot.chat(
					`/g kick ${member} You have been blacklisted from the guild, Mistake? --> (discord.gg/dEsfnJkQcq)`
				);
				console.log("Kicking " + member + ", because they are blacklisted.");
			}
		}
	},
};
