import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';

export default {
    data: {
        name: 'command',
        description: 'Execute a Minecraft command',
        options: [
            {
                name: 'command',
                description: 'Command to run (e.g. /g online)',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    run: async (bridge: Bridge, interaction: any, args: unknown[]) => {
        const cmd = (args[0] as string).startsWith('/') ? (args[0] as string) : `/${args[0]}`;
        const embed = new EmbedBuilder();
        try {
            await bridge.bot.executeAndCapture(cmd);
            embed
                .setColor('Green')
                .setTitle('Executed!')
                .setDescription(`Command \`${cmd}\` sent.`);
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
