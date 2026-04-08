import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';

export default {
    data: {
        name: 'togglemute',
        description: 'Mute or unmute a guild member',
        options: [
            {
                name: 'mute',
                description: 'Mute a member',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'user', description: 'Username', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'duration', description: 'Duration (e.g. 1d)', type: ApplicationCommandOptionType.String, required: true },
                ],
            },
            {
                name: 'unmute',
                description: 'Unmute a member',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'user', description: 'Username', type: ApplicationCommandOptionType.String, required: true },
                ],
            },
        ],
    },
    run: async (bridge: Bridge, interaction: any, args: unknown[]) => {
        const type = interaction.options.getSubcommand() as 'mute' | 'unmute';
        const user = args[0] as string;
        const duration = args[1] as string | undefined;
        const embed = new EmbedBuilder();
        try {
            await bridge.bot.executeAndCapture(`/g ${type} ${user}${type === 'mute' ? ` ${duration}` : ''}`);
            embed.setColor(type === 'mute' ? 'Red' : 'Green')
                .setTitle(type === 'mute' ? 'Muted!' : 'Unmuted!')
                .setDescription(`${user} was ${type}d${type === 'mute' ? ` for ${duration}!` : '!'}`);
        } catch (e) {
            embed.setColor('Red').setTitle('Error').setDescription(e as string);
        }
        await interaction.reply({ embeds: [embed] });
    },
    staffOnly: true,
};
