import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    type ChatInputCommandInteraction,
    type GuildMember,
} from 'discord.js';
import type Bridge from '@/bridge/bridge';
import { setBridgeMuted } from '@/modules/moderation/index';

const userOption = {
    name: 'user',
    description: 'Discord member',
    type: ApplicationCommandOptionType.User,
    required: true,
};

export default {
    data: {
        name: 'bridge',
        description: 'Control who can send messages through the bridge',
        options: [
            {
                name: 'mute',
                description: "Stop a member's messages from reaching Minecraft",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    userOption,
                    {
                        name: 'reason',
                        description: 'Reason (shown in the Discord audit log)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'unmute',
                description: 'Let a bridge-muted member send messages to Minecraft again',
                type: ApplicationCommandOptionType.Subcommand,
                options: [userOption],
            },
        ],
    },
    run: async (_bridge: Bridge, interaction: ChatInputCommandInteraction) => {
        const muted = interaction.options.getSubcommand() === 'mute';
        const member = interaction.options.getMember('user') as GuildMember | null;
        const reason = interaction.options.getString('reason');
        const embed = new EmbedBuilder();

        if (!member) {
            embed
                .setColor('Red')
                .setTitle('Error')
                .setDescription('That user is not in this server.');
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        try {
            await setBridgeMuted(
                member,
                muted,
                `${interaction.user.username}${reason ? `: ${reason}` : ''}`
            );
            if (muted) {
                embed
                    .setColor('Red')
                    .setTitle('Bridge-muted')
                    .setDescription(
                        `${member} can no longer send messages to Minecraft.${reason ? `\nReason: ${reason}` : ''}`
                    );
            } else {
                embed
                    .setColor('Green')
                    .setTitle('Bridge-unmuted')
                    .setDescription(`${member} can send messages to Minecraft again.`);
            }
        } catch (e) {
            embed
                .setColor('Red')
                .setTitle('Error')
                .setDescription(e instanceof Error ? e.message : String(e));
        }
        await interaction.reply({ embeds: [embed] });
    },
    staffOnly: true,
};
