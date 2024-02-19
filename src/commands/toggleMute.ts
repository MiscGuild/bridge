import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Command } from "../interfaces/Command";
import capitaliseString from "../util/capitaliseString";

export default {
	data: {
		name: "togglemute",
		description: "Mute or unmute a user in the guild!",
		options: [
			{
				name: "mute",
				description: "Mute a user in the guild!",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "user",
						description: "What is the name of the user you want to mute?",
						type: ApplicationCommandOptionType.String,
						required: true,
					},
					{
						name: "duration",
						description: "How long do you want to mute this user for?",
						type: ApplicationCommandOptionType.String,
						required: true,
					},
				],
			},
			{
				name: "unmute",
				description: "Unmute a user in the guild!",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "user",
						description: "What is the name of the user you want to unmute?",
						type: ApplicationCommandOptionType.String,
						required: true,
					},
				],
			},
		],
	},
	run: async (bot, interaction, args) => {
		const type = interaction.options.getSubcommand() as "mute" | "unmute";
		const user: string = args[0];
		const duration: string = args[1];

		const embed = new EmbedBuilder();
		try {
			await bot.executeTask(`/g ${type} ${user} ${duration}`);
			embed
				.setTitle(capitaliseString(`${type}d!`))
				.setDescription(`${user} was ${type}d` + (type === "mute" ? ` for ${duration}!` : "!"))
				.setColor(type === "mute" ? "Red" : "Green");
		} catch (e) {
			embed
				.setColor("Red")
				.setTitle("Error")
				.setDescription(e as string);
		}

		await interaction.reply({
			embeds: [embed],
		});
	},
	staffOnly: true,
} as Command;
