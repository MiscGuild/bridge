import { MessageEmbed } from "discord.js";
import { Command } from "../interfaces/Command";

export default {
	data: {
		name: "command",
		description: "Execute any command in game!",
		options: [
			{
				name: "command",
				description: "What command would you like to execute?",
                type: "STRING",
				required: true,
			},
		],
	},
	staffOnly: true,
	run: async (bot, interaction, args) => {
		const command = (args[0] as string).startsWith("/") ? (args[0] as string) : `/${args[0]}`;
		const embed = new MessageEmbed();

		try {
			await bot.executeTask(command);

			embed.setColor("GREEN").setTitle("Completed!").setDescription(`The command ${command} has been executed.`);
		} catch (e: any) {
			embed
				.setColor("RED")
				.setTitle("Error")
				.setDescription(e as string);
		}

		await interaction.reply({ embeds: [embed] });
	},
} as Command;
