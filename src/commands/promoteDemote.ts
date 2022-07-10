import { Command } from "../interfaces/Command";
import { MessageEmbed } from "discord.js";
import capitaliseString from "../util/capitaliseString";

export default {
	data: {
		name: "promoteDemote",
		description: "Promote or demote a user in the guild!",
		options: [
			{
				name: "type",
				description: "Would you like to promote or demote the user?",
				type: "STRING",
				choices: [
					{
						name: "promote",
						value: "promote",
					},
					{
						name: "demote",
						value: "demote",
					},
				],
				required: true,
			},
			{
				name: "user",
				description: "What is the name of the user you want to promote/demote?",
				type: "STRING",
				required: true,
			},
		],
	},
	staffOnly: true,
	run: async (bot, interaction, args) => {
		const type: string = args[0] as "promote" | "demote";
		const user: string = args[1];

		const embed = new MessageEmbed();
		try {
			await bot.executeTask(`/g ${type} ${user}`);
			embed
				.setColor(type === "promote" ? "GREEN" : "RED")
				.setTitle(capitaliseString(`${type}d!`))
				.setDescription(`${user} has been ${type}d!`);
		} catch (e) {
			embed
				.setColor("RED")
				.setTitle("Error")
				.setDescription(e as string);
		}

		await interaction.reply({
			embeds: [embed],
		});
	},
} as Command;
