import { Command } from "../interfaces/Command";
import { MessageEmbed } from "discord.js";

const choices = [0, 5, 10];

export default {
	data: {
		name: "slowmode",
		description: "Enable slowmode for the member channel!",
		options: [
			{
				name: "time",
				description: "What should the interval be between sending messages?",
				type: "INTEGER",
				choices: choices.map((value) => {
					return { name: value.toString(), value: value };
				}),
				required: true,
			},
		],
	},
	run: async (bot, interaction, args) => {
		const time = (args[0] as number) || 0;

		bot.memberChannel?.setRateLimitPerUser(time);

		const embed = new MessageEmbed()
			.setColor("GREEN")
			.setTitle("Slowmode set!")
			.setDescription(`Slowmode has been set to ${time}s`);

		await interaction.reply({ embeds: [embed] });
	},
	staffOnly: true,
} as Command;
