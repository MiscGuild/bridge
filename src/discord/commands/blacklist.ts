import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';
import { blacklistRepo, type BlacklistRecord } from '@/db/repositories/blacklist.repo';
import {
    addToBlacklist,
    KICK_RESULT_TEXT,
    parseExpiry,
    removeFromBlacklist,
} from '@/modules/blacklist/index';
import { getPlayerTags } from '@/services/coral';
import { mojangService } from '@/services/mojang';
import { discordTimestamp } from '@/util/formatting';

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
        description: 'Manage guild blacklist and check Coral cheater tags',
        options: [
            {
                name: 'check',
                description: 'Check a player against both Coral and Guild blacklists',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'user',
                        description: 'Minecraft username',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                ],
            },
            {
                name: 'add',
                description: 'Add a player to the guild blacklist',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'user',
                        description: 'Minecraft username',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'reason',
                        description: 'Reason for blacklisting',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'duration',
                        description: 'Duration (e.g. 7d, 2w, 30d) — omit for permanent',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'remove',
                description: 'Remove a player from the guild blacklist',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'user',
                        description: 'Minecraft username',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
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
                    embed
                        .setColor('Green')
                        .setTitle('Guild Blacklist')
                        .setDescription('No players on the guild blacklist.');
                } else {
                    const lines = entries.slice(0, 25).map((e) => {
                        const expiry = formatExpiry(e.expires_at);
                        return `• **${e.username}** — ${e.reason} (by ${e.added_by} | ${expiry})`;
                    });
                    if (entries.length > 25) lines.push(`*...and ${entries.length - 25} more*`);
                    embed
                        .setColor('Red')
                        .setTitle(`Guild Blacklist (${entries.length})`)
                        .setDescription(lines.join('\n'));
                }
                await interaction.reply({ embeds: [embed] });
                return;
            }

            const user = interaction.options.getString('user', true);
            const profile = await mojangService.getProfile(user);
            if (!profile) {
                embed
                    .setColor('Red')
                    .setTitle('Error')
                    .setDescription(`Player not found: **${user}**`);
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            if (sub === 'check') {
                const fields: { name: string; value: string; inline?: boolean }[] = [];

                const guildEntry = await blacklistRepo.getByUuid(profile.id).catch(() => null);
                if (guildEntry) {
                    fields.push({
                        name: 'Guild Blacklist',
                        value: `**Reason:** ${guildEntry.reason}\n**Added by:** ${guildEntry.added_by}\n**Date:** ${new Date(guildEntry.added_at).toLocaleDateString()}\n**Expiry:** ${formatExpiry(guildEntry.expires_at)}`,
                    });
                } else {
                    fields.push({ name: 'Guild Blacklist', value: 'Not blacklisted' });
                }

                const coralTags = await getPlayerTags(profile.id);
                if (coralTags === null) {
                    fields.push({
                        name: 'Coral Tags',
                        value: 'Could not check (no API key or error)',
                    });
                } else if (coralTags.length === 0) {
                    fields.push({ name: 'Coral Tags', value: 'No cheater tags' });
                } else {
                    const tagLines = coralTags.map(
                        (t) =>
                            `**[${(t.type || 'UNKNOWN').toUpperCase()}]** ${t.reason || 'No reason'}`
                    );
                    fields.push({
                        name: `Coral Tags (${coralTags.length} tag${coralTags.length > 1 ? 's' : ''})`,
                        value: tagLines.join('\n'),
                    });
                }

                const hasCoralTags = (coralTags?.length ?? 0) > 0;
                const isClean = !guildEntry && !hasCoralTags;
                embed
                    .setColor(isClean ? 'Green' : 'Red')
                    .setTitle(`Blacklist Check: ${profile.name}`)
                    .setThumbnail(`https://mc-heads.net/avatar/${profile.id}/64`)
                    .addFields(fields);

                await interaction.reply({ embeds: [embed] });
            } else if (sub === 'add') {
                const reason = interaction.options.getString('reason', true);
                const durationStr = interaction.options.getString('duration');
                const expiresAt = durationStr ? parseExpiry(durationStr) : null;

                if (durationStr && !expiresAt) {
                    embed
                        .setColor('Red')
                        .setTitle('Error')
                        .setDescription('Invalid duration format. Use e.g. `7d`, `2w`, `30d`.');
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    return;
                }

                // Kicking can retry for several seconds — acknowledge the command first
                await interaction.deferReply();

                const kickResult = await addToBlacklist(bridge, {
                    uuid: profile.id,
                    username: profile.name,
                    reason,
                    addedBy: interaction.user.username,
                    expiresAt,
                });

                embed
                    .setColor('Red')
                    .setTitle('Player Blacklisted')
                    .setDescription(`**${profile.name}** added to guild blacklist.`)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Added', value: discordTimestamp(new Date()), inline: true },
                        {
                            name: 'Expires',
                            value: expiresAt
                                ? `${discordTimestamp(expiresAt)} (${discordTimestamp(expiresAt, 'R')})`
                                : 'Never (Permanent)',
                            inline: true,
                        },
                        { name: 'Guild Status', value: KICK_RESULT_TEXT[kickResult], inline: true }
                    );
                await interaction.editReply({ embeds: [embed] });
            } else if (sub === 'remove') {
                await removeFromBlacklist(bridge, {
                    uuid: profile.id,
                    username: profile.name,
                    removedBy: interaction.user.username,
                });
                embed
                    .setColor('Green')
                    .setTitle('Player Removed')
                    .setDescription(`**${profile.name}** removed from guild blacklist.`);
                await interaction.reply({ embeds: [embed] });
            }
        } catch (e) {
            embed.setColor('Red').setTitle('Error').setDescription(`${e}`);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },
    staffOnly: true,
};
