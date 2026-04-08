import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

const choices = [0, 5, 10];

export default {
    data: {
        name: 'slowmode',
        description: 'Enable slowmode for the member channel!',
        options: [
            {
                name: 'time',
                description: 'What should the interval be between sending messages?',
                type: ApplicationCommandOptionType.Integer,
                choices: choices.map((value) => ({ name: value.toString(), value })),
                required: true,
            },
        ],
    },
    run: async (bridge, interaction, args) => {
        const time = (args[0] as number) || 0;

        bridge.discord.memberChannel?.setRateLimitPerUser(time);

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Slowmode set!')
            .setDescription(`Slowmode has been set to ${time}s`);

        await interaction.reply({ embeds: [embed] });
    },
    staffOnly: true,
} as Command;
