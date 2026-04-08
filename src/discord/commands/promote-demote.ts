import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';

export default {
    data: {
        name: 'promotedemote',
        description: 'Promote or demote a guild member',
        options: [
            {
                name: 'type',
                description: 'Promote or demote',
                type: ApplicationCommandOptionType.String,
                choices: [{ name: 'promote', value: 'promote' }, { name: 'demote', value: 'demote' }],
                required: true,
            },
            {
                name: 'user',
                description: 'Minecraft username',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    run: async (bridge: Bridge, interaction: any, args: unknown[]) => {
        const type = args[0] as 'promote' | 'demote';
        const user = args[1] as string;
        const embed = new EmbedBuilder();
        try {
            await bridge.bot.executeAndCapture(`/g ${type} ${user}`);
            embed.setColor(type === 'promote' ? 'Green' : 'Red')
                .setTitle(type === 'promote' ? 'Promoted!' : 'Demoted!')
                .setDescription(`${user} has been ${type}d!`);
        } catch (e) {
            embed.setColor('Red').setTitle('Error').setDescription(e as string);
        }
        await interaction.reply({ embeds: [embed] });
    },
    staffOnly: true,
};
