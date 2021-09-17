const index = require("../index.js");
const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const bot = index.bot;
const Discord = ("discord.js");

const successColor = "0x00A86B";
const errorColor = "0xDE3163";

module.exports = {
	name: "command",
	description: "Sends a command as the bot!",
	type: "CHAT_INPUT",
	options: [
		{
			"type": 3,
			"name": "command",
			"description": "What would you like to do?",
			"required": true
		}
	],
 
	run: async (client, interaction, args) => {
		if (!interaction.member.roles.cache.some((role) => role.name === "Staff")) {
			const embed = new MessageEmbed()
				.setTitle("Error")
				.setColor(errorColor)
				.setDescription(
					"It seems you are lacking the permission to run this command."
				);
			return interaction.followUp({ embeds: [embed], ephemeral: false });
		}
        
		bot.chat(`/${args[0]}`);
		const embed = new MessageEmbed()
			.setTitle("Sent!")
			.setColor(successColor)
			.setDescription(
				`I have sent the command \`${args[0]}\` in game!`
			);
		return interaction.followUp({ embeds: [embed] });
	},
};
