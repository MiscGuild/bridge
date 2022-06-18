import { BlacklistEntry } from "../interfaces/BlacklistEntry";
import { writeFile } from "fs";
import { CommandInteraction, MessageEmbed } from "discord.js";
import logError from "./logError";

/**
 * @param blacklist The blacklist value to save.
 * @param interaction The interaction to reply to in case of failure.
 * @param successEmbed The embed to reply with if successful
 */
export default (blacklist: BlacklistEntry[], interaction: CommandInteraction, successEmbed: MessageEmbed) => {
	writeFile("./src/util/_blacklist.json", JSON.stringify(blacklist), async (err) => {
		if (!err) {
			return await interaction.reply({ embeds: [successEmbed] });
		}

		logError(err, "Failed to write to blacklist file: ");

		const embed = new MessageEmbed()
			.setColor("RED")
			.setTitle("Error")
			.setDescription("Failed to write to blacklist file!");

		await interaction.reply({ embeds: [embed] });
	});
};
