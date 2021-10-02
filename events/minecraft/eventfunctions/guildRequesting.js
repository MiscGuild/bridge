import { bot } from "../../../index.js";
import fetch from "node-fetch";
import checkIfUserBlacklisted from "../../../utilities/checkIfUserBlacklisted.js";
import getNetworkLevel from "../../../utilities/getNetworkLevel.js";
import ashconGrabber from "../../../utilities/ashconGrabber.js";

export default {
	name: "guildRequesting",
	async execute(rank, username) {
		if (!rank) {
			rank = "";
		}
		// logger.info(`-----------------------------------------------------\n**${rank} ${username}** is requesting to join the guild! \nA staff member can do \`)command g accept ${username}\`\n-----------------------------------------------------`)

		if (await checkIfUserBlacklisted(username)) {
			bot.chat(
				`/oc The player ${username} is blacklisted. Do NOT accept their request.`
			);
		}
		else {
			const ashconAPI = await ashconGrabber(username);
			const HyAPI = await fetch(
				`https://api.hypixel.net/player?key=${process.env.HypixelAPIKey}&uuid=${ashconAPI.uuid}&player=${username}`
			).then((res) => res.json());

			if ((await getNetworkLevel(HyAPI.player.networkExp)) >= 50) {
				console.log(`Accepting the player ${username}`);
				bot.chat(`/g accept ${username}`);
			}
			else {
				bot.chat(`/oc The player ${username} is not network level 50!`);
			}
		}
	},
};
