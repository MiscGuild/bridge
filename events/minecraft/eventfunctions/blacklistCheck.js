const index = require("../../../index.js");
const checkIfUserBlacklisted = require("../../../utilities/checkIfUserBlacklisted.js");
const bot = index.bot;

module.exports = {
	name: "blacklistCheck",
	async execute(message) {
		const guildMembers = message.split(" ●  ");
		for (const member of guildMembers) {
			if (await checkIfUserBlacklisted(member)) {
				bot.chat(
					`/g kick ${player} You have been blacklisted from the guild, Mistake? --> (discord.gg/dEsfnJkQcq)`
				);
				console.log("Kicking " + player + ", because they are blacklisted.");
			}
		}
	},
};
