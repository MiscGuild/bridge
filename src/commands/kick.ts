import { Command } from "../interfaces/Command";
import { EmbedBuilder } from "discord.js";

export default {
	data: {
		name: "kick",
		description: "Kick a user from the guild!",
		options: [
			{
				name: "user",
				description: "What is the name of the user you want to kick?",
				type: "STRING",
				required: true,
			},
			{
				name: "reason",
				description: "Why are you kicking this user?",
				type: "STRING",
				required: true,
			},
		],
	},
	staffOnly: true,
	run: async (bot, interaction, args) => {
		const user: string = args[0];
		const reason: string = args[1];

		const embed = new EmbedBuilder();
		try {
			await bot.executeTask(`/g kick ${user} ${reason}`);
			embed.setTitle("Kicked!").setDescription(`\`${user}\` has been kicked for \`${reason}\``).setColor("RED");
		} catch (e) {
			embed
				.setColor("RED")
				.setTitle("Error")
				.setDescription(e as string);
		}

		await interaction.reply({ embeds: [embed] });
	},
} as Command;
