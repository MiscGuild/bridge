import { Command } from "../interfaces/Command";
import { EmbedBuilder } from "discord.js";

export default {
	data: {
		name: "help",
		description: "View a list of all commands!",
	},
	run: async (bot, interaction) => {
		const embed = new EmbedBuilder().setColor("Purple").setTitle("Commands");

		bot.discord.commands.forEach((command) => {
			embed.addFields({ name: command.data.name, value: command.data.description });
		});

		await interaction.reply({ embeds: [embed] });
	},
} as Command;
