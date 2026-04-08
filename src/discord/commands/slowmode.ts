import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';

export default {
    data: {
        name: 'slowmode',
        description: 'Set slowmode on the member channel',
        options: [
            {
                name: 'time',
                description: 'Seconds between messages (0 to disable)',
                type: ApplicationCommandOptionType.Integer,
                choices: [{ name: '0', value: 0 }, { name: '5', value: 5 }, { name: '10', value: 10 }],
                required: true,
            },
        ],
    },
    run: async (bridge: Bridge, interaction: any, args: unknown[]) => {
        const time = (args[0] as number) ?? 0;
        await bridge.discord.memberChannel?.setRateLimitPerUser(time);
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('Slowmode updated')
                    .setDescription(`Slowmode set to ${time}s`),
            ],
        });
    },
    staffOnly: true,
};
