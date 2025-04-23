import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { writeFile } from 'fs';
import logError from './log-error';
import bot from '..';

/**
 * @param path The path to the target file. Path must begin from the path root.
 * @param data The data to save.
 * @param interaction The interaction to reply to in case of failure.
 * @param successEmbed The embed to reply with if successful.
 */

export default (
    path: string,
    data: any,
    interaction: CommandInteraction,
    successEmbed: EmbedBuilder
) => {
    writeFile(path, JSON.stringify(data), async (err) => {
        if (!err) {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [successEmbed] });
                return;
            }
            await interaction.reply({ embeds: [successEmbed] });
            return;
        }

        logError(bot, err as Error, 'Failed to write to file');

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Error')
            .setDescription('Failed to write to file!');

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [successEmbed] });
            return;
        }
        await interaction.reply({ embeds: [embed] });
    });
};
