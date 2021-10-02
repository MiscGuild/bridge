import { bot } from "../../../index.js";
import fetch from "node-fetch";
import crypto from "crypto";
import ashconGrabber from "../../../utilities/ashconGrabber.js";

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
		const HypixelAPIKey = process.env.HypixelAPIKey;

		if(message.startsWith("weeklygexp" || "weeklygxp")) {
			const ashconAPI = await ashconGrabber(username);
			fetch(`https://api.hypixel.net/guild?key=${HypixelAPIKey}&player=${ashconAPI.uuid}`)
				.then(res => res.json())
				.then(data => {
					for (const item in data.guild.members) {
						if (data.guild.members[item].uuid == ashconAPI.uuid) {
							const gexpLIST = data.guild.members[item].expHistory;
							bot.chat(`/w ${username} Your total weekly gexp: ${gexpFunction(gexpLIST).toLocaleString()} | ${randomID}`);
						}
					}
				});
		}
		else if(message.startsWith("Boop!")) {bot.chat(`/boop ${username}`);}

		else{
			const usernameMention = message.split(" ")[0];
			let validUser = true;
			const ashconAPI = await ashconGrabber(usernameMention);

			if (!ashconAPI.uuid) {
				validUser = false;
				return bot.chat(`/w ${username} ${usernameMention} was not found (Try giving me a username and/or check spelling) | ${randomID}`);
			}

			if (validUser) {
				fetch(`https://api.hypixel.net/guild?key=${HypixelAPIKey}&player=${ashconAPI.uuid}`)
					.then(res => {return res.json();})
					.then(data => {
						if(!data.guild) {
							return bot.chat(`/w ${username} ${usernameMention} does not seem to be in a guild | ${randomID}`);
						}
						for (const item in data.guild.members) {
							if (data.guild.members[item].uuid == ashconAPI.uuid) {
								const gexpList = data.guild.members[item].expHistory;
								return bot.chat(`/w ${username} ${ashconAPI.name}'s total weekly gexp: ${gexpFunction(gexpList).toLocaleString()} | ${randomID}`);
							}
						}
					});
			}
		}
	}
};