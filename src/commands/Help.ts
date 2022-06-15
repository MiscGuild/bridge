import { Command } from "../interfaces/DiscordCommand";
import { MessageEmbed } from "discord.js";

export default {
	data: {
		name: "help",
		description: "View a list of all commands!",
		type: "CHAT_INPUT",
	},

	// @ts-ignore Disused args parameter
	run: async (bot, interaction, args) => {
		const embed = new MessageEmbed().setTitle("Commands");

		bot.discord.commands.forEach((command) => {
			const description = command.data.type == "CHAT_INPUT" ? command.data.description : "";
			embed.addField(command.data.name, description);
		});

		interaction.followUp({ embeds: [embed] });
	},
} as Command;
