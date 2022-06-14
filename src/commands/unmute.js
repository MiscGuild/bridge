import { bot } from "../../index.js";
import { MessageEmbed } from "discord.js";
import { successColor, missingPermsEmbed } from "../resources/consts.js";

export default {
	name: "unmute",
	description: "Unmute a player in-game",
	type: "CHAT_INPUT",
	options: [
		{
			"type": 3,
			"name": "user",
			"description": "Who would you like to unmute?",
			"required": true
		},
	],

	run: async (client, interaction, args) => {
		if (!interaction.member.roles.cache.some((role) => role.name === "Staff")) {
			return interaction.followUp({ embeds: [missingPermsEmbed], ephemeral: true });
		}

		bot.chat(`/g unmute ${args[0]}`);
		const embed = new MessageEmbed()
			.setTitle("Unmuted!")
			.setColor(successColor)
			.setDescription(
				`The user \`${args[0]}\` has been unmuted!`
			);
		return interaction.followUp({ embeds: [embed] });
	}
};