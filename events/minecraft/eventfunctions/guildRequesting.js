import { bot } from "../../../index.js";
import checkIfUserBlacklisted from "../../../utilities/checkIfUserBlacklisted.js";
import getNetworkLevel from "../../../utilities/getNetworkLevel.js";
import ashconGrabber from "../../../utilities/ashconGrabber.js";
import getHypixelPlayerData from "../../../utilities/getHypixelPlayerData.js";

export default {
	name: "guildRequesting",
	async execute(rank, username) {
		if (!rank) {rank = "";}
		// logger.info(`-----------------------------------------------------\n**${rank} ${username}** is requesting to join the guild! \nA staff member can do \`)command g accept ${username}\`\n-----------------------------------------------------`)

		if (await checkIfUserBlacklisted(username)) {
			bot.chat(
				`/oc The player ${username} is blacklisted. Do NOT accept their request.`
			);
		}
		else {
			const ashconAPI = await ashconGrabber(username);
			const playerData = await getHypixelPlayerData(ashconAPI.uuid, username);
			
			if ((await getNetworkLevel(playerData.player.networkExp)) >= 50) {
				console.log(`Accepting the player ${username}`);
				bot.chat(`/g accept ${username}`);
			}
			else {
				bot.chat(`/oc The player ${username} is not network level 50!`);
			}
		}
	},
};
