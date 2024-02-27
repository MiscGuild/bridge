import { Command } from "../interfaces/Command";
import { EmbedBuilder } from "discord.js";

export default {
	data: {
		name: "reboot",
		description: "Reboot the bot! (Only works if your host automatically restarts the application)",
	},
	run: async (bot, interaction) => {
		const embed = new EmbedBuilder()
			.setColor("Green")
			.setTitle("Rebooting")
			.setDescription("Rebooting in 15 seconds...");

		bot.sendGuildMessage("gc", "Rebooting in 15 seconds...");
		bot.logger.info(`Rebooting due to ${interaction.member?.user.username} running the reboot command.`);

		setTimeout(() => {
			process.exit();
		}, 15_000);

		await interaction.reply({ embeds: [embed] });
	},
	staffOnly: true,
} as Command;
