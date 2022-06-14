import { bot } from "../../index.js";
import { MessageEmbed } from "discord.js";
import { errorColor, missingPermsEmbed } from "../resources/consts.js";

export default {
	name: "demote",
	description: "Demotes a user in the guild!",
	type: "CHAT_INPUT",
	options: [
		{
			"type": 3,
			"name": "user",
			"description": "Who would you like to demote?",
			"required": true
		},
	],
 
	run: async (client, interaction, args) => {
		if (!interaction.member.roles.cache.some((role) => role.name === "Staff")) {
			return interaction.followUp({ embeds: [missingPermsEmbed], ephemeral: false });
		}
        
		bot.chat(`/g demote ${args[0]}`);
		const embed = new MessageEmbed()
			.setTitle("Demoted!")
			.setColor(errorColor)
			.setDescription(
				`The user \`${args[0]}\` has been demoted!`
			);
		return interaction.followUp({ embeds: [embed] });
	},
};
