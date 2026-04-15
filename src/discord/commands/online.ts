import { EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';

export default {
    data: {
        name: 'online',
        description: 'Show current online guild member count',
    },
    run: async (bridge: Bridge, interaction: any) => {
        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Online Members')
            .setDescription(
                `**${bridge.onlineCount - 1}** / **${bridge.totalCount}** guild members online`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
