import { Event } from "../../interfaces/Event";
import { Interaction } from "discord.js";
import Bot from "../../classes/Bot";

export default {
	name: "interactionCreate",
	runOnce: false,
	run: async (bot: Bot, interaction: Interaction) => {
		if (!interaction.isCommand()) return;

		const command = bot.discord.commands.get(interaction.commandName);

		if (!command) {
			bot.logger.error(`Unknown slash command: ${interaction.commandName}`);
			return;
		}

		const args: any[] = [];

		for (const option of interaction.options.data) {
			if (option.value) args.push(option.value);

			if (option.type === "SUB_COMMAND" && option.options) {
				for (const v of option.options) {
					if (v.value) args.push(v.value);
				}
			}
		}

		try {
			command.run(bot, interaction, args);
		} catch (e: any) {
			await interaction.reply({
				content: "There was an error while executing this command!",
				ephemeral: true,
			});
			bot.logger.error(`An error occured in ${interaction.commandName}: ${e.message}`);
		}
	},
} as Event;
