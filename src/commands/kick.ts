import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Command } from "../interfaces/Command";

export default {
	data: {
		name: "kick",
		description: "Kick a user from the guild!",
		options: [
			{
				name: "user",
				description: "What is the name of the user you want to kick?",
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: "reason",
				description: "Why are you kicking this user?",
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async (bot, interaction, args) => {
		const user: string = args[0];
		const reason: string = args[1];

		const embed = new EmbedBuilder();
		try {
			await bot.executeTask(`/g kick ${user} ${reason}`);
			embed.setTitle("Kicked!").setDescription(`\`${user}\` has been kicked for \`${reason}\``).setColor("Red");
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
