import { bot } from "../index.js";
import { MessageEmbed } from "discord.js";
import { errorColor, missingPermsEmbed } from "../resources/consts.js";

export default {
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
			return interaction.followUp({ embeds: [missingPermsEmbed], ephemeral: true });
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