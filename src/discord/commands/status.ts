import { EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';
import { formatDuration } from '@/util/formatting';

export default {
    data: {
        name: 'status',
        description: 'Show bot status, uptime, and connection info',
    },
    run: async (bridge: Bridge, interaction: any) => {
        const uptime = formatDuration(process.uptime() * 1000);
        const mcState = bridge.bot.state;
        const dcState = bridge.discord.isReady() ? 'Connected' : 'Disconnected';

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Bot Status')
            .addFields(
                { name: 'Uptime', value: uptime, inline: true },
                { name: 'Minecraft', value: mcState, inline: true },
                { name: 'Discord', value: dcState, inline: true },
                {
                    name: 'Online',
                    value: `${bridge.onlineCount - 1}/${bridge.totalCount}`,
                    inline: true,
                },
                { name: 'Queue', value: '—', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
