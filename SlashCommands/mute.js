const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const Discord = require("discord.js");
const index = require("../index.js");
const bot = index.bot;
const errorColor = "0xDE3163";

module.exports = {
	name: "mute",
	description: "Mute a player in-game",
	type: "CHAT_INPUT",
	options: [
		{
			"type": 3,
			"name": "user",
			"description": "Who would you like to mute?",
			"required": true
		},
		{
			"type": 3,
			"name": "time",
			"description": "How long would you like to mute this user for?",
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
			return interaction.followUp({ embeds: [embed], ephemeral: true });
		}

		bot.chat(`/g mute ${args[0]} ${args[1]}`);
		const embed = new MessageEmbed()
			.setTitle("Muted!")
			.setColor(errorColor)
			.setDescription(
				`The user \`${args[0]}\` has been muted for \`${args[1]}\``
			);
		return interaction.followUp({ embeds: [embed] });
	}
};