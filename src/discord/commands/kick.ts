import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';

export default {
    data: {
        name: 'kick',
        description: 'Kick a user from the guild',
        options: [
            {
                name: 'user',
                description: 'Minecraft username to kick',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'reason',
                description: 'Reason for kicking',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    run: async (bridge: Bridge, interaction: any, args: unknown[]) => {
        const user = args[0] as string;
        const reason = args[1] as string;
        const embed = new EmbedBuilder();
        try {
            await bridge.bot.executeAndCapture(`/g kick ${user} ${reason}`);
            embed.setColor('Red').setTitle('Kicked!').setDescription(`\`${user}\` has been kicked for \`${reason}\``);
        } catch (e) {
            embed.setColor('Red').setTitle('Error').setDescription(e as string);
        }
        await interaction.reply({ embeds: [embed] });
    },
    staffOnly: true,
};
