import logger from 'consola';
import { ApplicationCommandOptionType, EmbedBuilder, GuildMember, Interaction } from 'discord.js';
import env from '../../util/env';

export default {
    name: 'interactionCreate',
    runOnce: false,
    run: async (bot, interaction: Interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = bot.discord.commands.get(interaction.commandName);

        if (!command) {
            logger.error(`Unknown slash command: ${interaction.commandName}`);
            return;
        }

        const member = interaction.member as GuildMember;
        if (
            command.staffOnly &&
            !member.roles.cache.has(env.STAFF_ROLE_ID) &&
            member.id !== env.BOT_OWNER_ID
        ) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Error')
                .setDescription('You do not have permission to run that command!');

            await interaction.reply({ embeds: [embed] });
            return;
        }

        const args: unknown[] = [];
        interaction.options.data.forEach((option) => {
            if (option.value) args.push(option.value);

            if (option.type === ApplicationCommandOptionType.Subcommand && option.options) {
                option.options.forEach((subOption) => {
                    if (subOption.value) args.push(subOption.value);
                });
            }
        });

        try {
            command.run(bot, interaction, args);
        } catch (e: unknown) {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });

            logger.error(`An error occured in ${interaction.commandName}: ${(e as Error).message}`);
        }
    },
} as Event;
