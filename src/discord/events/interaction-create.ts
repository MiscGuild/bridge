import { ApplicationCommandOptionType, EmbedBuilder, GuildMember, Interaction } from 'discord.js';
import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';
import env from '@/config/env';

export default {
    name: 'interactionCreate',
    once: false,
    run: async (bridge: Bridge, interaction: Interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = bridge.discord.commands.get(interaction.commandName);
        if (!command) {
            consola.error(`Unknown slash command: ${interaction.commandName}`);
            return;
        }

        const member = interaction.member as GuildMember;
        if (
            command.staffOnly &&
            !member.roles.cache.has(env.STAFF_ROLE_ID) &&
            member.id !== env.BOT_OWNER_ID
        ) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error')
                        .setDescription('You do not have permission to use this command!'),
                ],
                ephemeral: true,
            });
            return;
        }

        const args: unknown[] = [];
        for (const option of interaction.options.data) {
            if (option.value !== undefined) args.push(option.value);
            if (option.type === ApplicationCommandOptionType.Subcommand && option.options) {
                for (const sub of option.options) {
                    if (sub.value !== undefined) args.push(sub.value);
                }
            }
        }

        try {
            await command.run(bridge, interaction, args);
        } catch (err) {
            consola.error(`Error in command ${interaction.commandName}:`, err);
            const reply = {
                content: 'An error occurred while running this command.',
                ephemeral: true,
            };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    },
};
