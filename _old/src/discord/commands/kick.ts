import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

export default {
    data: {
        name: 'kick',
        description: 'Kick a user from the guild!',
        options: [
            {
                name: 'user',
                description: 'What is the name of the user you want to kick?',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'reason',
                description: 'Why are you kicking this user?',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    run: async (bridge, interaction, args) => {
        const user = args[0] as string;
        const reason = args[1] as string;

        const embed = new EmbedBuilder();
        try {
            await bridge.mineflayer.execute(`/g kick ${user} ${reason}`, true);

            embed
                .setTitle('Kicked!')
                .setDescription(`\`${user}\` has been kicked for \`${reason}\``)
                .setColor('Red');
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
