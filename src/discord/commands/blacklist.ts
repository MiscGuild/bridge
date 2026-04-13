import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';
import { blacklistRepo, type BlacklistRecord } from '@/db/repositories/blacklist.repo';
import { mojangService } from '@/services/mojang';
import env from '@/config/env';

interface UrchinTag {
    type: string;
    reason?: string;
}

interface UrchinResponse {
    tags?: UrchinTag[];
}

async function queryUrchin(uuid: string): Promise<UrchinResponse | null> {
    const apiKey = env.URCHIN_API_KEY;
    if (!apiKey) return null;
    try {
        const url = `https://urchin.ws/player/${uuid}?key=${apiKey}&sources=GAME,MANUAL,CHAT,ME,PARTY`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'MiscellaneousBridge/3.0', Accept: 'application/json' },
        });
        if (res.status === 404) return { tags: [] };
        if (!res.ok) return null;
        return await res.json() as UrchinResponse;
    } catch {
        return null;
    }
}

function parseDuration(dur: string): string | null {
    const match = dur.match(/^(\d+)([mhdw])$/i);
    if (!match) return null;
    const num = parseInt(match[1]!, 10);
    const unit = match[2]!.toLowerCase();
    const ms = unit === 'm' ? num * 60_000 : unit === 'h' ? num * 3_600_000 : unit === 'd' ? num * 86_400_000 : num * 7 * 86_400_000;
    return new Date(Date.now() + ms).toISOString();
}

function formatExpiry(expiresAt: string | null): string {
    if (!expiresAt) return 'Permanent';
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return 'Expired';
    const days = Math.floor(remaining / 86_400_000);
    const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
}

export default {
    data: {
        name: 'blacklist',
        description: 'Manage guild blacklist and check Urchin cheater tags',
        options: [
            {
                name: 'check',
                description: 'Check a player against both Urchin and Guild blacklists',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'user', description: 'Minecraft username', type: ApplicationCommandOptionType.String, required: true },
                ],
            },
            {
                name: 'add',
                description: 'Add a player to the guild blacklist',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'user', description: 'Minecraft username', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'reason', description: 'Reason for blacklisting', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'duration', description: 'Duration (e.g. 7d, 2w, 30d) — omit for permanent', type: ApplicationCommandOptionType.String, required: false },
                ],
            },
            {
                name: 'remove',
                description: 'Remove a player from the guild blacklist',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'user', description: 'Minecraft username', type: ApplicationCommandOptionType.String, required: true },
                ],
            },
            {
                name: 'list',
                description: 'Show all players on the guild blacklist',
                type: ApplicationCommandOptionType.Subcommand,
            },
        ],
    },
    run: async (bridge: Bridge, interaction: any) => {
        const sub = interaction.options.getSubcommand() as 'check' | 'add' | 'remove' | 'list';
        const embed = new EmbedBuilder();

        try {
            if (sub === 'list') {
                const entries = await blacklistRepo.getAll().catch(() => [] as BlacklistRecord[]);
                if (entries.length === 0) {
                    embed.setColor('Green').setTitle('Guild Blacklist').setDescription('No players on the guild blacklist.');
                } else {
                    const lines = entries.slice(0, 25).map(e => {
                        const expiry = formatExpiry(e.expires_at);
                        return `• **${e.username}** — ${e.reason} (by ${e.added_by} | ${expiry})`;
                    });
                    if (entries.length > 25) lines.push(`*...and ${entries.length - 25} more*`);
                    embed.setColor('Red').setTitle(`Guild Blacklist (${entries.length})`).setDescription(lines.join('\n'));
                }
                await interaction.reply({ embeds: [embed] });
                return;
            }

            const user = interaction.options.getString('user', true);
            const profile = await mojangService.getProfile(user);
            if (!profile) {
                embed.setColor('Red').setTitle('Error').setDescription(`Player not found: **${user}**`);
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            if (sub === 'check') {
                const fields: { name: string; value: string; inline?: boolean }[] = [];

                const guildEntry = await blacklistRepo.getByUuid(profile.id).catch(() => null);
                if (guildEntry) {
                    fields.push({
                        name: '🚫 Guild Blacklist',
                        value: `**Reason:** ${guildEntry.reason}\n**Added by:** ${guildEntry.added_by}\n**Date:** ${new Date(guildEntry.added_at).toLocaleDateString()}\n**Expiry:** ${formatExpiry(guildEntry.expires_at)}`,
                    });
                } else {
                    fields.push({ name: '✅ Guild Blacklist', value: 'Not blacklisted' });
                }

                const urchin = await queryUrchin(profile.id);
                if (!urchin) {
                    fields.push({ name: '⚠️ Urchin Blacklist', value: 'Could not check (no API key or error)' });
                } else if (!urchin.tags || urchin.tags.length === 0) {
                    fields.push({ name: '✅ Urchin Blacklist', value: 'No cheater tags' });
                } else {
                    const tagLines = urchin.tags.map(t =>
                        `**[${(t.type || 'UNKNOWN').toUpperCase()}]** ${t.reason || 'No reason'}`
                    );
                    fields.push({
                        name: `🚨 Urchin Blacklist (${urchin.tags.length} tag${urchin.tags.length > 1 ? 's' : ''})`,
                        value: tagLines.join('\n'),
                    });
                }

                const isClean = !guildEntry && (!urchin?.tags || urchin.tags.length === 0);
                embed.setColor(isClean ? 'Green' : 'Red')
                    .setTitle(`Blacklist Check: ${profile.name}`)
                    .setThumbnail(`https://mc-heads.net/avatar/${profile.id}/64`)
                    .addFields(fields);

                await interaction.reply({ embeds: [embed] });
            } else if (sub === 'add') {
                const reason = interaction.options.getString('reason', true);
                const durationStr = interaction.options.getString('duration');
                const expiresAt = durationStr ? parseDuration(durationStr) : null;

                if (durationStr && !expiresAt) {
                    embed.setColor('Red').setTitle('Error').setDescription('Invalid duration format. Use e.g. `7d`, `2w`, `30d`.');
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    return;
                }

                await blacklistRepo.add({ uuid: profile.id, username: profile.name, reason, added_by: interaction.user.username, expires_at: expiresAt });
                bridge.blacklist.add(profile.id);

                const expiryText = expiresAt ? `Expires: ${formatExpiry(expiresAt)}` : 'Permanent';
                embed.setColor('Red').setTitle('🚫 Player Blacklisted')
                    .setDescription(`**${profile.name}** added to guild blacklist.\nReason: ${reason}\n${expiryText}`);
                await interaction.reply({ embeds: [embed] });
            } else if (sub === 'remove') {
                await blacklistRepo.remove(profile.id);
                bridge.blacklist.remove(profile.id);
                embed.setColor('Green').setTitle('✅ Player Removed')
                    .setDescription(`**${profile.name}** removed from guild blacklist.`);
                await interaction.reply({ embeds: [embed] });
            }
        } catch (e) {
            embed.setColor('Red').setTitle('Error').setDescription(`${e}`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
    staffOnly: true,
};
