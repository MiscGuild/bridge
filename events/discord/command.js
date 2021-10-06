import { bot } from "../../index.js";
import Discord from "discord.js";
import { prefix, errorColor, errorEmbed, missingPermsEmbed } from "../../resources/consts.js";
import log4js from "log4js";
const errorLogs = log4js.getLogger("Errors");

export default {
	name: "message",
	async execute(message) {
		if (!message.content.startsWith(prefix) || message.author.bot) {return;}

		const args = message.content
			.slice(prefix.length)
			.trim()
			.split(" ");
		const command = args.shift().toLowerCase();

		if (command === "command".toLowerCase()) {
			try {
				if (message.member.roles.cache.some((role) => role.name === "Staff")) {
					if (!args.length) {
						const embed = new Discord.MessageEmbed()
							.setTitle("Error")
							.setColor(errorColor)
							.setDescription("You need to provide a message for me to send!");

						return message.channel.send({ embeds: [embed] });
					}
					return bot.chat(`/${args.join(" ").toString()}`), message.react("✅");
				}
				else {
					return message.channel.send({ embeds: [missingPermsEmbed] });
				}
			}
			catch (err) {
				errorLogs.error(err);
				console.log(err);
				return message.channel.send({ embeds: [errorEmbed] });
			}
		}
	},
};
