import { EmbedBuilder } from 'discord.js';
import winston from 'winston';

export default {
    data: {
        name: 'terminate',
        description: 'Terminate the current session!',
    },
    run: async (bridge, interaction) => {
        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Terminated')
            .setDescription('The bot has been terminated.');

        bridge.mineflayer.chat('gc', 'Session terminated');
        winston.info(`Session terminated by ${interaction.member?.user.username}`);
        await interaction.reply({ embeds: [embed] });

        process.exit();
    },
    staffOnly: true,
} as Command;
