const index = require("../index.js");
const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const bot = index.bot;
const Discord = ("discord.js");

module.exports = {
	name: "kick",
	description: "Kicks a user from the guild!",
	type: "CHAT_INPUT",
	options: [
		{
			"type": 3,
			"name": "user",
			"description": "Who would you like to kick?",
			"required": true
		},
		{
			"type": 3,
			"name": "reason",
			"description": "Why would you like to kick this user?",
			"required": true
		}
	],
 
	run: async (client, interaction, args) => {
		if (!interaction.member.roles.cache.some((role) => role.name === "Staff")) {
			const embed = new MessageEmbed()
				.setTitle("Error")
				.setDescription(
					"It seems you are lacking the permission to run this command."
				);
			return interaction.followUp({ embeds: [embed], ephemeral: true });
		}
        
		bot.chat(`/g kick ${args[0]} ${args[1]} [Kicker: ${interaction.member.displayName}]`);
		const embed = new MessageEmbed()
			.setTitle("Kicked!")
			.setDescription(
				`I have kicked \`${args[0]}\` with the reason \`${args[1]}\``
			);
		return interaction.followUp({ embeds: [embed] });
	},
};
