const index = require("../index.js");
const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const bot = index.bot;

const successColor = "0x00A86B";
const errorColor = "0xDE3163";

module.exports = {
	name: "promote",
	description: "Promotes a user in the guild!",
	type: "CHAT_INPUT",
	options: [
		{
			"type": 3,
			"name": "user",
			"description": "Who would you like to promote?",
			"required": true
		},
	],
 
	run: async (client, interaction, args) => {
		if (!interaction.member.roles.cache.some((role) => role.name === "Staff")) {
			const embed = new MessageEmbed()
				.setTitle("Error")
				.setColor(errorColor)
				.setDescription(
					"It seems you are lacking the permission to run this command."
				);
			return interaction.followUp({ embeds: [embed], ephemeral: true });
		}
        
		bot.chat(`/g promote ${args[0]}`);
		const embed = new MessageEmbed()
			.setTitle("Promoted!")
			.setColor(successColor)
			.setDescription(
				`The user \`${args[0]}\` has been promoted!`
			);
		return interaction.followUp({ embeds: [embed] });
	},
};
