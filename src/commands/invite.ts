import { Command } from "../interfaces/Command";
import { EmbedBuilder } from "discord.js";

export default {
	data: {
		name: "invite",
		description: "Invite a user to the guild!",
		options: [
			{
				name: "user",
				description: "What is the name of the user you want to invite?",
				type: "STRING",
				required: true,
			},
		],
	},
	staffOnly: true,
	run: async (bot, interaction, args) => {
		const user = args[0];

		const embed = new EmbedBuilder();
		try {
			await bot.executeTask(`/g invite ${user}`);
			embed.setTitle("Invited!").setDescription(`\`${user}\` has been invited to the guild!`).setColor("GREEN");
		} catch (e) {
			embed
				.setColor("RED")
				.setTitle("Error")
				.setDescription(e as string);
		}

		await interaction.reply({ embeds: [embed] });
	},
} as Command;
