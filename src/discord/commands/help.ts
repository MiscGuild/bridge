import { EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';

export default {
    data: {
        name: 'help',
        description: 'View all available commands',
    },
    run: async (bridge: Bridge, interaction: any) => {
        const embed = new EmbedBuilder().setColor('Purple').setTitle('Commands');
        bridge.discord.commands.forEach((cmd) => {
            embed.addFields({ name: `/${cmd.data.name}`, value: cmd.data.description });
        });
        await interaction.reply({ embeds: [embed] });
    },
};
