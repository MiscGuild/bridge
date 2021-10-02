import { bot } from "../../index.js";
import log4js from "log4js";
import Discord from "discord.js";
const errorLogs = log4js.getLogger("Errors");

const errorColor = "0xDE3163";
const errorEmbed = new Discord.MessageEmbed()
	.setTitle("Error")
	.setColor(errorColor)
	.setDescription(
		"An error has occurred while running this command. Please contact ElijahRus#9099"
	);

export default {
	name: "message",
	async execute(message) {
		if (!message.content.startsWith(process.env.PREFIX) || message.author.bot) {return;}

		const args = message.content
			.slice(process.env.PREFIX.length)
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
					const embed = new Discord.MessageEmbed()
						.setTitle("Error")
						.setColor(errorColor)
						.setDescription(
							"It seems you are lacking the permission to run this command."
						);

					return message.channel.send({ embeds: [embed] });
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
