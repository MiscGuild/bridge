import { CommandInteraction, MessageEmbed } from "discord.js";
import { BlacklistEntry } from "../interfaces/BlacklistEntry";
import logError from "./logError";
import { writeFile } from "fs";

/**
 * @param path The path to the target file. Path must begin from ./src.
 * @param data The data to save.
 * @param interaction The interaction to reply to in case of failure.
 * @param successEmbed The embed to reply with if successful.
 */
export default (path: string, data: BlacklistEntry[], interaction: CommandInteraction, successEmbed: MessageEmbed) => {
	writeFile(path, JSON.stringify(data), async (err) => {
		if (!err) {
			return await interaction.reply({ embeds: [successEmbed] });
		}

		logError(err, "Failed to write to file: ");

		const embed = new MessageEmbed().setColor("RED").setTitle("Error").setDescription("Failed to write to file!");

		await interaction.reply({ embeds: [embed] });
	});
};
