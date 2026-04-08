import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

export default {
    data: {
        name: 'invite',
        description: 'Invite a user to the guild!',
        options: [
            {
                name: 'user',
                description: 'What is the name of the user you want to invite?',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    run: async (bridge, interaction, args) => {
        const user = args[0] as string;

        const embed = new EmbedBuilder();
        try {
            await bridge.mineflayer.execute(`/g invite ${user}`, true);

            embed
                .setTitle('Invited!')
                .setDescription(`\`${user}\` has been invited to the guild!`)
                .setColor('Green');
        } catch (e) {
            embed
                .setColor('Red')
                .setTitle('Error')
                .setDescription(e as string);
        }

        await interaction.reply({ embeds: [embed] });
    },
    staffOnly: true,
} as Command;
