import { ApplicationCommandOptionType, EmbedBuilder, GuildMember, Interaction } from "discord.js";
import { Event } from "../../interfaces/Event";

export default {
	name: "interactionCreate",
	runOnce: false,
	run: async (bot, interaction: Interaction) => {
		if (!interaction.isChatInputCommand()) return;

		const command = bot.discord.commands.get(interaction.commandName);

		if (!command) {
			bot.logger.error(`Unknown slash command: ${interaction.commandName}`);
			return;
		}

		const member = interaction.member as GuildMember;
		if (
			command.staffOnly &&
			!member.roles.cache.has(process.env.STAFF_ROLE_ID) &&
			member.id !== process.env.BOT_OWNER_ID
		) {
			const embed = new EmbedBuilder()
				.setColor("Red")
				.setTitle("Error")
				.setDescription("You do not have permission to run that command!");

			await interaction.reply({ embeds: [embed] });
			return;
		}

		const args = [];
		for (const option of interaction.options.data) {
			if (option.value) args.push(option.value);

			if (option.type === ApplicationCommandOptionType.Subcommand && option.options) {
				for (const v of option.options) {
					if (v.value) args.push(v.value);
				}
			}
		}

		try {
			command.run(bot, interaction, args);
		} catch (e: unknown) {
			await interaction.reply({
				content: "There was an error while executing this command!",
				ephemeral: true,
			});

			bot.logger.error(`An error occured in ${interaction.commandName}: ${(e as Error).message}`);
		}
	},
} as Event;
