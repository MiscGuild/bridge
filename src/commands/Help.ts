import { Command } from "../interfaces/DiscordCommand";
import { MessageEmbed } from "discord.js";

export default {
	data: {
		name: "help",
		description: "View a list of all commands!",
	},

	// @ts-ignore Disused args parameter
	run: async (bot, interaction, args) => {
		const embed = new MessageEmbed().setColor("PURPLE").setTitle("Commands");

		bot.discord.commands.forEach((command) => {
			embed.addField(command.data.name, command.data.description);
		});

		interaction.reply({ embeds: [embed] });
	},
} as Command;
