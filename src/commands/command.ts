import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Command } from "../interfaces/Command";

export default {
	data: {
		name: "command",
		description: "Execute any command in game!",
		options: [
			{
				name: "command",
				description: "What command would you like to execute?",
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async (bot, interaction, args) => {
		const command = (args[0] as string).startsWith("/") ? (args[0] as string) : `/${args[0]}`;
		const embed = new EmbedBuilder();

		try {
			await bot.executeTask(command);

			embed
				.setColor("Green")
				.setTitle("Completed!")
				.setDescription(`The command \`${command}\` has been executed.`);
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
