import { Command } from "../interfaces/Command";
import { MessageEmbed } from "discord.js";

export default {
	data: {
		name: "help",
		description: "View a list of all commands!",
	},
	run: async (bot, interaction) => {
		const embed = new MessageEmbed().setColor("PURPLE").setTitle("Commands");

		bot.discord.commands.forEach((command) => {
			embed.addField(command.data.name, command.data.description);
		});

		await interaction.reply({ embeds: [embed] });
	},
} as Command;
