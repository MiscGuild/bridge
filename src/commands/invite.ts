import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Command } from "../interfaces/Command";

export default {
	data: {
		name: "invite",
		description: "Invite a user to the guild!",
		options: [
			{
				name: "user",
				description: "What is the name of the user you want to invite?",
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async (bot, interaction, args) => {
		const user = args[0];

		const embed = new EmbedBuilder();
		try {
			await bot.executeTask(`/g invite ${user}`);
			embed.setTitle("Invited!").setDescription(`\`${user}\` has been invited to the guild!`).setColor("Green");
		} catch (e) {
			embed
				.setColor("Red")
				.setTitle("Error")
				.setDescription(e as string);
		}

		await interaction.reply({ embeds: [embed] });
	},
	staffOnly: true,
} as Command;
