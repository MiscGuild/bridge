import { bot } from "../../../index.js";
import crypto from "crypto";
import mojangPlayerGrabber from "../../../utilities/mojangPlayerGrabber.js";
import getGuildFromPlayer from "../../../utilities/getGuildFromPlayer.js";

function gexpFunction(gexpList) {
	let sum = 0;
	for (const gexp of Object.values(gexpList)) {
		sum += gexp;
	}
	return sum;
}

export default {
	name: "whisperBot",
	async execute(username, message) {
		const randomID = crypto.randomBytes(7).toString("hex");

		if(message.startsWith("weeklygexp" || "weeklygxp")) {
			const mojangAPI = await mojangPlayerGrabber(username);
			const playerGuild = await getGuildFromPlayer(mojangAPI.id);

			for (const item in playerGuild.guild.members) {
				if (playerGuild.guild.members[item].uuid == mojangAPI.id) {
					const gexpLIST = playerGuild.guild.members[item].expHistory;
					bot.chat(`/w ${username} Your total weekly gexp: ${gexpFunction(gexpLIST).toLocaleString()} | ${randomID}`);
				}
			}
		}
		else if(message.startsWith("Boop!")) {bot.chat(`/boop ${username}`);}

		else{
			const usernameMention = message.split(" ")[0];
			let validUser = true;
			const mojangAPI = await mojangPlayerGrabber(usernameMention);

			if (!mojangAPI.id) {
				validUser = false;
				return bot.chat(`/w ${username} ${usernameMention} was not found (Try giving me a username and/or check spelling) | ${randomID}`);
			}

			if (validUser) {
				const playerGuild = await getGuildFromPlayer(mojangAPI.id);
				if(!playerGuild.guild) {
					return bot.chat(`/w ${username} ${usernameMention} does not seem to be in a guild | ${randomID}`);
				}
				for (const item in playerGuild.guild.members) {
					if (playerGuild.guild.members[item].uuid == mojangAPI.id) {
						const gexpList = playerGuild.guild.members[item].expHistory;
						return bot.chat(`/w ${username} ${mojangAPI.name}'s total weekly gexp: ${gexpFunction(gexpList).toLocaleString()} | ${randomID}`);
					}
				}
			}
		}
	}
};