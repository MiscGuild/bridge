import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';
import { warnsRepo } from '@/db/repositories/mutes.repo';
import { mojangService } from '@/services/mojang';
import { findDiscordMember, dmUser } from '@/modules/mute-warn/index';
import { auditLogRepo } from '@/db/repositories/audit-log.repo';

export default {
    data: {
        name: 'warn',
        description: 'Warn a guild member or view/clear warnings',
        options: [
            {
                name: 'add',
                description: 'Warn a member',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'user', description: 'Minecraft username', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'reason', description: 'Reason for warning', type: ApplicationCommandOptionType.String, required: true },
                ],
            },
            {
                name: 'list',
                description: 'View warnings for a member',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'user', description: 'Minecraft username', type: ApplicationCommandOptionType.String, required: true },
                ],
            },
            {
                name: 'clear',
                description: 'Clear all warnings for a member',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'user', description: 'Minecraft username', type: ApplicationCommandOptionType.String, required: true },
                ],
            },
        ],
    },
    run: async (bridge: Bridge, interaction: any) => {
        const sub = interaction.options.getSubcommand() as 'add' | 'list' | 'clear';
        const user = interaction.options.getString('user', true);
        const embed = new EmbedBuilder();

        try {
            if (sub === 'add') {
                const reason = interaction.options.getString('reason', true);
                const profile = await mojangService.getProfile(user).catch(() => null);
                const discordMember = await findDiscordMember(bridge, user);

                await warnsRepo.create({
                    uuid: profile?.id ?? '',
                    username: user,
                    discord_id: discordMember?.id ?? null,
                    reason,
                    warned_by: interaction.user.username,
                }).catch(() => {});

                const total = (await warnsRepo.getByUsername(user).catch(() => [])).length;
                await auditLogRepo.log(interaction.user.username, 'warn', user, { reason }).catch(() => {});

                embed.setColor('Yellow').setTitle('⚠️ Warning Issued')
                    .setDescription(`**${user}** has been warned.\nReason: ${reason}\nTotal warnings: ${total}`);

                await dmUser(bridge, discordMember?.id,
                    `⚠️ You have received a warning from **${interaction.user.username}**.\nReason: ${reason}\nTotal warnings: ${total}`
                );
            } else if (sub === 'list') {
                const warns = await warnsRepo.getByUsername(user).catch(() => []);
                if (warns.length === 0) {
                    embed.setColor('Green').setTitle('No Warnings')
                        .setDescription(`**${user}** has no warnings.`);
                } else {
                    const lines = warns.slice(-10).map(w => {
                        const date = new Date(w.warned_at).toLocaleDateString();
                        return `• **${date}** by ${w.warned_by}: ${w.reason}`;
                    });
                    embed.setColor('Yellow').setTitle(`⚠️ Warnings for ${user} (${warns.length})`)
                        .setDescription(lines.join('\n'));
                }
            } else {
                const count = await warnsRepo.clearByUsername(user).catch(() => 0);
                await auditLogRepo.log(interaction.user.username, 'clearwarns', user).catch(() => {});
                embed.setColor('Green').setTitle('✅ Warnings Cleared')
                    .setDescription(`Cleared ${count} warning(s) for **${user}**.`);
            }
        } catch (e) {
            embed.setColor('Red').setTitle('Error').setDescription(e as string);
        }
        await interaction.reply({ embeds: [embed] });
    },
    staffOnly: true,
};
