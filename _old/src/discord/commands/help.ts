import { EmbedBuilder } from 'discord.js';

export default {
    data: {
        name: 'help',
        description: 'View a list of all commands!',
    },
    run: async (bridge, interaction) => {
        const embed = new EmbedBuilder().setColor('Purple').setTitle('Commands');

        bridge.discord.commands.forEach((command) => {
            embed.addFields({ name: command.data.name, value: command.data.description });
        });

        await interaction.reply({ embeds: [embed] });
    },
} as Command;
