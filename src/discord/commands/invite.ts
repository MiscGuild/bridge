import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';

export default {
    data: {
        name: 'invite',
        description: 'Invite a player to the guild',
        options: [
            {
                name: 'user',
                description: 'Minecraft username to invite',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    run: async (bridge: Bridge, interaction: any, args: unknown[]) => {
        const user = args[0] as string;
        const embed = new EmbedBuilder();
        try {
            await bridge.bot.executeAndCapture(`/g invite ${user}`);
            embed
                .setColor('Green')
                .setTitle('Invited!')
                .setDescription(`\`${user}\` has been invited to the guild!`);
        } catch (e) {
            embed
                .setColor('Red')
                .setTitle('Error')
                .setDescription(e as string);
        }
        await interaction.reply({ embeds: [embed] });
    },
    staffOnly: true,
};
