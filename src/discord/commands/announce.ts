import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';

export default {
    data: {
        name: 'announce',
        description: 'Broadcast a message to guild chat',
        options: [
            {
                name: 'message',
                description: 'The message to announce',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    run: async (bridge: Bridge, interaction: any, args: unknown[]) => {
        const msg = args[0] as string;
        bridge.bot.chat('gc', msg);
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('Announced!')
                    .setDescription(`Sent to guild chat: \`${msg}\``),
            ],
        });
    },
    staffOnly: true,
};
