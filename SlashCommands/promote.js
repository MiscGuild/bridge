import { bot } from "../index.js";
import { MessageEmbed } from "discord.js";
import { successColor, errorColor } from "../resources/consts.js";

export default {
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
