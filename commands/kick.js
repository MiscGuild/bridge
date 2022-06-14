import { bot } from "../index.js";
import { MessageEmbed } from "discord.js";
import { errorColor, missingPermsEmbed } from "../resources/consts.js";

export default {
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
			return interaction.followUp({ embeds: [missingPermsEmbed], ephemeral: true });
		}
        
		bot.chat(`/g kick ${args[0]} ${args[1]} [Kicker: ${interaction.member.displayName}]`);
		const embed = new MessageEmbed()
			.setTitle("Kicked!")
			.setColor(errorColor)
			.setDescription(
				`The user \`${args[0]}\` has been kicked for the reason \`${args[1]}\``
			);
		return interaction.followUp({ embeds: [embed] });
	},
};
