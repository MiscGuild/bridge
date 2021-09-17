const index = require("../../../index.js");
const bot = index.bot;
const fetch = require("node-fetch");
const crypto = require("crypto");
const mojangGrabber = require("../../../utilities/mojangGrabber.js");

function gexpFunction(gexpList) {
	let sum = 0;
	for (const gexp of Object.values(gexpList)) {
		sum += gexp;
	}
	return sum;
}

module.exports = {
	name: "whisperBot",
	async execute(username, message) {
		const randomID = crypto.randomBytes(7).toString("hex");
		const HypixelAPIKey = process.env.HypixelAPIKey;

		if(message.startsWith("weeklygexp" || "weeklygxp")) {
			const mojangAPI = await mojangGrabber(username);
			fetch(`https://api.hypixel.net/guild?key=${HypixelAPIKey}&player=${mojangAPI.id}`)
				.then(res => res.json())
				.then(data => {
					for (const item in data.guild.members) {
						if (data.guild.members[item].uuid == mojangAPI.id) {
							const gexpLIST = data.guild.members[item].expHistory;
							bot.chat(`/w ${username} ${username}'s total weekly gexp: ${gexpFunction(gexpLIST).toLocaleString()} | ${randomID}`);
						}
					}
				});
		}
		else if(message.startsWith("Boop!")) {bot.chat(`/boop ${username}`);}

		else{
			const usernameMention = message.split(" ")[0];
			let validUser = true;
			const mojangAPI = await mojangGrabber(usernameMention);

			if (!mojangAPI) {
				validUser = false;
				return bot.chat(`/w ${username} ${usernameMention} was not found (Try giving me a username and/or check spelling) | ${randomID}`);
			}

			if (validUser) {
				fetch(`https://api.hypixel.net/guild?key=${HypixelAPIKey}&player=${mojangAPI.id}`)
					.then(res => {return res.json();})
					.then(data => {
						if(!data.guild) {
							return bot.chat(`/w ${username} ${usernameMention} does not seem to be in a guild | ${randomID}`);
						}
						for (const item in data.guild.members) {
							if (data.guild.members[item].uuid == mojangAPI.id) {
								const gexpList = data.guild.members[item].expHistory;
								return bot.chat(`/w ${username} ${mojangAPI.name}'s total weekly gexp: ${gexpFunction(gexpList).toLocaleString()} | ${randomID}`);
							}
						}
					});
			}
		}
	}
};