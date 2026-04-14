import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';
import { mutesRepo } from '@/db/repositories/mutes.repo';
import { mojangService } from '@/services/mojang';
import { syncDiscordMuteRole, findDiscordMember, dmUser, parseDuration, formatRemaining } from '@/modules/mute-warn/index';

export default {
    data: {
        name: 'mute',
        description: 'Mute or unmute a guild member (syncs MC + Discord)',
        options: [
            {
                name: 'mute',
                description: 'Mute a member',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'user', description: 'Minecraft username', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'duration', description: 'Duration (e.g. 1d, 2h, 30m)', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'reason', description: 'Reason for muting', type: ApplicationCommandOptionType.String, required: false },
                ],
            },
            {
                name: 'unmute',
                description: 'Unmute a member',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'user', description: 'Minecraft username', type: ApplicationCommandOptionType.String, required: true },
                ],
            },
            {
                name: 'info',
                description: 'Check if a member is currently muted',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'user', description: 'Minecraft username', type: ApplicationCommandOptionType.String, required: true },
                ],
            },
        ],
    },
    run: async (bridge: Bridge, interaction: any) => {
        const sub = interaction.options.getSubcommand() as 'mute' | 'unmute' | 'info';
        const user = interaction.options.getString('user', true);
        const embed = new EmbedBuilder();

        try {
            if (sub === 'info') {
                const mute = await mutesRepo.getByUsername(user).catch(() => null);
                if (!mute) {
                    embed.setColor('Green').setTitle('Not Muted').setDescription(`**${user}** is not currently muted.`);
                } else {
                    embed.setColor('Orange').setTitle('Muted')
                        .setDescription(`**${user}** is muted by **${mute.muted_by}**\nRemaining: ${formatRemaining(mute.expires_at)}\nReason: ${mute.reason}`);
                }
                await interaction.reply({ embeds: [embed] });
                return;
            }

            const duration = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason') ?? 'Muted via Discord';

            await bridge.bot.executeAndCapture(`/g ${sub} ${user}${sub === 'mute' ? ` ${duration}` : ''}`);

            const profile = await mojangService.getProfile(user).catch(() => null);
            const discordMember = await findDiscordMember(bridge, user);

            if (sub === 'mute') {
                const expiresAt = duration ? parseDuration(duration) : null;
                await mutesRepo.create({
                    uuid: profile?.id ?? '',
                    username: user,
                    discord_id: discordMember?.id ?? null,
                    reason,
                    muted_by: interaction.user.username,
                    expires_at: expiresAt,
                }).catch(() => {});
                await syncDiscordMuteRole(bridge, discordMember?.id, true);
                embed.setColor('Red').setTitle('Muted!')
                    .setDescription(`**${user}** muted for ${duration}\nReason: ${reason}`);

                await dmUser(bridge, discordMember?.id,
                    `You have been muted in the guild by **${interaction.user.username}** for ${duration}.\nReason: ${reason}\nYou cannot use the bridge chat while muted.`
                );
            } else {
                const existing = await mutesRepo.getByUsername(user).catch(() => null);
                await mutesRepo.deactivateByUsername(user).catch(() => {});
                const discordId = existing?.discord_id ?? discordMember?.id;
                await syncDiscordMuteRole(bridge, discordId, false);
                embed.setColor('Green').setTitle('Unmuted!')
                    .setDescription(`**${user}** has been unmuted.`);

                await dmUser(bridge, discordId,
                    `You have been unmuted in the guild by **${interaction.user.username}**. You can use the bridge chat again.`
                );
            }
        } catch (e) {
            embed.setColor('Red').setTitle('Error').setDescription(e as string);
        }
        await interaction.reply({ embeds: [embed] });
    },
    staffOnly: true,
};
