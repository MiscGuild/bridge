import { EmbedBuilder } from 'discord.js';
import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';

export default {
    data: {
        name: 'terminate',
        description: 'Shut down the bot',
    },
    run: async (bridge: Bridge, interaction: any) => {
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Terminating')
                    .setDescription('Shutting down...'),
            ],
        });
        consola.info(`Bot terminated by ${interaction.user.username}`);
        bridge.bot.chat('gc', 'Session terminated. Goodbye!');
        setTimeout(() => process.exit(0), 1000);
    },
    staffOnly: true,
};
