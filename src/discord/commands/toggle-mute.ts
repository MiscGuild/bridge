import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';
import { mutesRepo } from '@/db/repositories/mutes.repo';
import { mojangService } from '@/services/mojang';
import { syncDiscordMuteRole, findDiscordMember } from '@/modules/mute-warn/index';

export default {
    data: {
        name: 'togglemute',
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
        ],
    },
    run: async (bridge: Bridge, interaction: any, args: unknown[]) => {
        const type = interaction.options.getSubcommand() as 'mute' | 'unmute';
        const user = interaction.options.getString('user', true);
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') ?? 'Muted via Discord';
        const embed = new EmbedBuilder();

        try {
            await bridge.bot.executeAndCapture(`/g ${type} ${user}${type === 'mute' ? ` ${duration}` : ''}`);

            const profile = await mojangService.getProfile(user).catch(() => null);
            const discordMember = await findDiscordMember(bridge, user);

            if (type === 'mute') {
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
                embed.setColor('Red').setTitle('🔇 Muted!')
                    .setDescription(`**${user}** muted for ${duration}\nReason: ${reason}`);
            } else {
                await mutesRepo.deactivateByUsername(user).catch(() => {});
                const existing = await mutesRepo.getByUsername(user).catch(() => null);
                const discordId = existing?.discord_id ?? discordMember?.id;
                await syncDiscordMuteRole(bridge, discordId, false);
                embed.setColor('Green').setTitle('✅ Unmuted!')
                    .setDescription(`**${user}** has been unmuted.`);
            }
        } catch (e) {
            embed.setColor('Red').setTitle('Error').setDescription(e as string);
        }
        await interaction.reply({ embeds: [embed] });
    },
    staffOnly: true,
};

function parseDuration(dur: string): string | null {
    const match = dur.match(/^(\d+)([mhd])$/i);
    if (!match) return null;
    const num = parseInt(match[1]!, 10);
    const unit = match[2]!.toLowerCase();
    const ms = unit === 'm' ? num * 60_000 : unit === 'h' ? num * 3_600_000 : num * 86_400_000;
    return new Date(Date.now() + ms).toISOString();
}
