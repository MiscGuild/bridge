import type Bridge from '@/bridge/bridge';
import type { ModuleCommand } from '@/modules/types';
import { blacklistRepo, type BlacklistRecord } from '@/db/repositories/blacklist.repo';
import { mojangService } from '@/services/mojang';
import { hypixelService } from '@/services/hypixel';
import { EmbedBuilder, TextChannel } from 'discord.js';
import { consola } from 'consola';
import cooldowns from '@/util/cooldown';
import env from '@/config/env';
import { guildRankService } from '@/services/guild-ranks';
import messageQueue from '@/queue/message-queue';

interface UrchinTag {
    type: string;
    reason?: string;
}

interface UrchinResponse {
    tags?: UrchinTag[];
}

function hex(): string {
    return `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0')}`;
}

/** Discord timestamp: <t:UNIX:style> */
function discordTs(
    date: Date | string | null,
    style: 'f' | 'R' | 'F' | 'd' | 'D' | 'T' | 't' = 'f'
): string {
    if (!date) return 'Never';
    const unix = Math.floor(new Date(date).getTime() / 1000);
    return `<t:${unix}:${style}>`;
}

/** Send a blacklist action embed to the configured log channel. Returns the sent message id (when added). */
async function sendBlacklistLog(
    bridge: any,
    action: 'added' | 'removed',
    playerName: string,
    playerUuid: string,
    addedBy: string,
    reason?: string,
    expiresAt?: string | null
): Promise<string | null> {
    const channelId = env.BLACKLIST_CHANNEL_ID;
    if (!channelId) return null;
    try {
        const channel = await bridge.discord.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) return null;

        const displayName = env.BLACKLIST_ANONYMOUS ? 'Miscellaneous Staff' : addedBy;
        const now = new Date();
        const embed = new EmbedBuilder()
            .setThumbnail(`https://mc-heads.net/avatar/${playerUuid}/64`)
            .setTimestamp(now);

        if (action === 'added') {
            embed
                .setColor('Red')
                .setTitle('Player Blacklisted')
                .addFields(
                    { name: 'Player', value: `**${playerName}**`, inline: true },
                    { name: 'Added by', value: displayName, inline: true },
                    { name: 'Reason', value: reason ?? 'No reason provided' },
                    { name: 'Added', value: discordTs(now, 'f'), inline: true },
                    {
                        name: 'Expires',
                        value: expiresAt
                            ? discordTs(expiresAt, 'f') + ` (${discordTs(expiresAt, 'R')})`
                            : 'Never (Permanent)',
                        inline: true,
                    }
                );
        } else {
            embed
                .setColor('Green')
                .setTitle('Player Removed from Blacklist')
                .addFields(
                    { name: 'Player', value: `**${playerName}**`, inline: true },
                    { name: 'Removed by', value: displayName, inline: true },
                    { name: 'Removed', value: discordTs(now, 'f'), inline: true }
                );
        }

        const sent = await (channel as TextChannel).send({ embeds: [embed] });
        return sent.id;
    } catch {
        return null;
    }
}

/** Build the "expired" version of a blacklist embed (used to edit the original log message). */
function buildExpiredEmbed(record: BlacklistRecord): EmbedBuilder {
    const now = new Date();
    return new EmbedBuilder()
        .setColor('Grey')
        .setTitle('Blacklist Expired')
        .setThumbnail(`https://mc-heads.net/avatar/${record.uuid}/64`)
        .addFields(
            { name: 'Player', value: `**${record.username}**`, inline: true },
            {
                name: 'Originally added by',
                value: env.BLACKLIST_ANONYMOUS ? 'Miscellaneous Staff' : record.added_by,
                inline: true,
            },
            { name: 'Reason', value: record.reason || 'No reason provided' },
            { name: 'Added', value: discordTs(record.added_at, 'f'), inline: true },
            {
                name: 'Expired',
                value: `${discordTs(record.expires_at ?? now, 'f')} (auto-removed)`,
                inline: true,
            }
        )
        .setTimestamp(now);
}

/** Build a re-join detection embed for an active record whose expiry was just extended. */
function buildRejoinEmbed(
    record: BlacklistRecord,
    extensionMonths: number,
    newExpiresAt: string
): EmbedBuilder {
    const now = new Date();
    return new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle('Blacklisted Player Re-Joined — Auto-Kicked')
        .setThumbnail(`https://mc-heads.net/avatar/${record.uuid}/64`)
        .addFields(
            { name: 'Player', value: `**${record.username}**`, inline: true },
            {
                name: 'Originally added by',
                value: env.BLACKLIST_ANONYMOUS ? 'Miscellaneous Staff' : record.added_by,
                inline: true,
            },
            { name: 'Reason', value: record.reason || 'No reason provided' },
            { name: 'Added', value: discordTs(record.added_at, 'f'), inline: true },
            {
                name: 'New Expiry',
                value: `${discordTs(newExpiresAt, 'f')} (${discordTs(newExpiresAt, 'R')})`,
                inline: true,
            },
            {
                name: 'Re-Join Detected',
                value: `${discordTs(now, 'f')} — extended by **${extensionMonths} month${extensionMonths === 1 ? '' : 's'}**`,
            }
        )
        .setTimestamp(now);
}

/**
 * Query Urchin API using the same URL format as the original extension:
 * https://urchin.ws/player/{uuid}?key={key}&sources=GAME,MANUAL,CHAT,ME,PARTY
 */
async function queryUrchin(uuid: string): Promise<UrchinResponse | null> {
    const apiKey = env.URCHIN_API_KEY;
    if (!apiKey) return null;
    try {
        const url = `https://urchin.ws/player/${uuid}?key=${apiKey}&sources=GAME,MANUAL,CHAT,ME,PARTY`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'MiscellaneousBridge/2.6 (info@vliegenier04.dev)',
                Accept: 'application/json',
            },
        });
        if (res.status === 404) return { tags: [] };
        if (res.status === 401) return null; // invalid key
        if (res.status === 429) return null; // rate limited
        if (!res.ok) return null;
        return (await res.json()) as UrchinResponse;
    } catch {
        return null;
    }
}

/** Simplified check for auto-kick on guild join */
export async function isUrchinFlagged(uuid: string): Promise<boolean> {
    const data = await queryUrchin(uuid);
    return !!data?.tags && data.tags.length > 0;
}

export async function getUrchinTags(uuid: string): Promise<string[]> {
    const data = await queryUrchin(uuid);
    return data?.tags?.map((t) => t.type) ?? [];
}

/**
 * Aggressively enforce a blacklist kick. The Hypixel queue is paused (so no
 * other queued chat messages can interleave and slow us down), then `/g kick`
 * is sent up to 3 times with a 5-second gap between attempts. Returns early
 * as soon as we observe a "was kicked / left the guild" confirmation for the
 * target. The queue is always resumed in the finally block.
 */
export async function enforceBlacklistKick(
    bridge: any,
    playerName: string,
    reason?: string
): Promise<boolean> {
    const fullReason = reason ?? `Blacklisted. Dispute? ${env.DISCORD_INVITE_LINK}`;
    const command = `/g kick ${playerName} ${fullReason}`;

    // Confirmation: kicked OR voluntarily left while we were attempting.
    const confirmRe = new RegExp(
        `\\b${playerName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b.*?(was kicked from the guild|left the guild)`,
        'i'
    );

    let confirmed = false;
    let confirmResolve: (() => void) | null = null;
    const confirmPromise = new Promise<void>((res) => {
        confirmResolve = res;
    });

    const listener = (jsonMsg: unknown) => {
        const raw = typeof jsonMsg === 'string' ? jsonMsg : String(jsonMsg);
        const str = raw.replace(/§./g, '');
        if (confirmRe.test(str)) {
            confirmed = true;
            confirmResolve?.();
        }
    };

    const mcBot = bridge.bot?.bot;
    if (mcBot?.on) mcBot.on('message', listener);

    messageQueue.pause();
    try {
        for (let attempt = 1; attempt <= 3 && !confirmed; attempt++) {
            try {
                messageQueue.sendDirect(command);
            } catch (err) {
                consola.warn(`[Blacklist] kick attempt ${attempt} send failed:`, err);
            }

            // Wait up to 5s, but break early on confirmation.
            await Promise.race([
                confirmPromise,
                new Promise<void>((r) => setTimeout(r, 5000)),
            ]);
        }
    } finally {
        if (mcBot?.removeListener) mcBot.removeListener('message', listener);
        messageQueue.resume();
    }

    return confirmed;
}


/** Check if a player is in the guild and kick them. Returns status string. */
async function tryGuildKick(
    bridge: any,
    playerName: string,
    playerUuid: string
): Promise<'kicked' | 'not_in_guild' | 'kick_failed'> {
    try {
        const guild = await hypixelService.getGuildByName(env.HYPIXEL_GUILD_NAME);
        if (!guild) return 'not_in_guild';

        const normalUuid = playerUuid.replace(/-/g, '');
        const isMember = guild.members.some(
            (m) => m.uuid.replace(/-/g, '') === normalUuid
        );
        if (!isMember) return 'not_in_guild';

        const ok = await enforceBlacklistKick(bridge, playerName);
        return ok ? 'kicked' : 'kick_failed';
    } catch {
        return 'kick_failed';
    }
}

export function registerBlacklistModule(commands: ModuleCommand[]): void {
    // !view [username] — check Urchin tags + internal blacklist (self if no arg)
    commands.push({
        commandId: 'blacklist:view',
        pattern: /^!view(?:\s+(\S+))?/i,
        async handler(ctx, bridge) {
            const remaining = cooldowns.isOnCooldown(ctx.username, ctx.guildRank, 'urchin');
            if (remaining > 0) {
                bridge.bot.chat(
                    ctx.replyChannel,
                    `${ctx.username}, cooldown: ${remaining}s | ${hex()}`
                );
                return;
            }

            const target = ctx.matches[1]?.trim() ?? ctx.username;
            const profile = await mojangService.getProfile(target);
            if (!profile) {
                bridge.bot.chat(
                    ctx.replyChannel,
                    `[NOT-TAGGED] ${target} is not a valid Minecraft username. | ${hex()}`
                );
                return;
            }

            cooldowns.setCooldown(ctx.username, 'urchin', ctx.guildRank);

            // Internal blacklist check
            const internalEntry = await blacklistRepo.getByUuid(profile.id).catch(() => null);
            if (internalEntry) {
                bridge.bot.chat(
                    ctx.replyChannel,
                    `[INTERNAL] ${profile.name} - ${internalEntry.reason ?? 'No reason'} | ${hex()}`
                );
            }

            // Urchin API check
            const urchin = await queryUrchin(profile.id);

            if (!urchin) {
                if (!internalEntry) {
                    bridge.bot.chat(
                        ctx.replyChannel,
                        `[ERROR] Failed to check blacklist for ${profile.name}. Try again later. | ${hex()}`
                    );
                }
                return;
            }

            if (!urchin.tags || urchin.tags.length === 0) {
                if (!internalEntry) {
                    bridge.bot.chat(
                        ctx.replyChannel,
                        `[NOT-TAGGED] ${profile.name} has no tags in the blacklist. | ${hex()}`
                    );
                }
                return;
            }

            // Display each tag individually, matching original format
            for (const tag of urchin.tags) {
                const tagType = (tag.type || 'UNKNOWN').toUpperCase().replace(/ /g, '-');
                const reason = tag.reason || 'No reason given';
                let msg = `[${tagType}] ${profile.name} - ${reason} | ${hex()}`;
                if (msg.length > 200) msg = msg.slice(0, 197) + '...';
                bridge.bot.chat(ctx.replyChannel, msg);
            }
        },
    });

    // !blacklist add <username> [duration] [reason] — add to internal blacklist (staff only)
    commands.push({
        commandId: 'blacklist:add',
        pattern: /^!blacklist\s+add\s+(\S+)(?:\s+(\d+[mhdw]))?(?:\s+(.+))?/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!guildRankService.isStaffRank(ctx.guildRank)) {
                bridge.bot.chat(ctx.replyChannel, `${ctx.username}, you don't have permission.`);
                return;
            }

            const target = ctx.matches[1]!;
            const durationStr = ctx.matches[2];
            const reason = ctx.matches[3] ?? 'No reason provided';
            const profile = await mojangService.getProfile(target);
            if (!profile) {
                bridge.bot.chat(ctx.replyChannel, `Player not found: ${target}`);
                return;
            }

            let expiresAt: string | null = null;
            if (durationStr) {
                const match = durationStr.match(/^(\d+)([mhdw])$/i);
                if (match) {
                    const num = parseInt(match[1]!, 10);
                    const unit = match[2]!.toLowerCase();
                    const ms =
                        unit === 'm'
                            ? num * 60_000
                            : unit === 'h'
                              ? num * 3_600_000
                              : unit === 'd'
                                ? num * 86_400_000
                                : num * 7 * 86_400_000;
                    expiresAt = new Date(Date.now() + ms).toISOString();
                }
            }

            await blacklistRepo
                .add({
                    uuid: profile.id,
                    username: profile.name,
                    reason,
                    added_by: ctx.username,
                    expires_at: expiresAt,
                })
                .catch(() => {});
            bridge.blacklist.add(profile.id);

            // Auto-kick if still in guild
            const kickResult = await tryGuildKick(bridge, profile.name, profile.id);
            const kickStatus =
                kickResult === 'kicked'
                    ? ' | Kicked from guild'
                    : kickResult === 'kick_failed'
                      ? ' | Kick failed'
                      : '';

            const expiryMsg = expiresAt ? ` (expires in ${durationStr})` : ' (permanent)';
            bridge.bot.chat(
                'oc',
                `${profile.name} added to internal blacklist: ${reason}${expiryMsg}${kickStatus}`
            );

            // Log to blacklist channel
            const messageId = await sendBlacklistLog(
                bridge,
                'added',
                profile.name,
                profile.id,
                ctx.username,
                reason,
                expiresAt
            );

            // Persist the message id so future expiry / re-join updates can edit it
            if (messageId) {
                const fresh = await blacklistRepo.getByUuid(profile.id).catch(() => null);
                if (fresh) {
                    await blacklistRepo
                        .setDiscordMessageId(fresh.id, messageId)
                        .catch(() => {});
                }
            }
        },
    });

    // !blacklist remove <username> — remove from internal blacklist (staff only)
    commands.push({
        commandId: 'blacklist:remove',
        pattern: /^!blacklist\s+remove\s+(\S+)/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!guildRankService.isStaffRank(ctx.guildRank)) {
                bridge.bot.chat(ctx.replyChannel, `${ctx.username}, you don't have permission.`);
                return;
            }

            const target = ctx.matches[1]!;
            const profile = await mojangService.getProfile(target);
            if (!profile) {
                bridge.bot.chat(ctx.replyChannel, `Player not found: ${target}`);
                return;
            }

            await blacklistRepo.remove(profile.id).catch(() => {});
            bridge.blacklist.remove(profile.id);
            bridge.bot.chat('oc', `${profile.name} removed from internal blacklist.`);

            // Log to blacklist channel
            await sendBlacklistLog(bridge, 'removed', profile.name, profile.id, ctx.username);
        },
    });
}

// ── Scheduled tasks ──────────────────────────────────────────────────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Sweep for blacklist entries whose expires_at has passed.
 * Deactivates them, edits the original Discord embed to reflect expiry,
 * removes them from the in-memory cache, and announces in officer chat.
 */
export async function runExpirySweep(bridge: Bridge): Promise<void> {
    let expired: BlacklistRecord[] = [];
    try {
        expired = await blacklistRepo.expireOverdue();
    } catch (err) {
        consola.warn('[Blacklist] expireOverdue failed:', err);
        return;
    }

    for (const record of expired) {
        try {
            bridge.blacklist.remove(record.uuid);

            const expiredEmbed = buildExpiredEmbed(record);
            await bridge.discord
                .editBlacklistMessage(record.discord_message_id, expiredEmbed)
                .catch(() => false);

            await bridge.discord.sendEmbed('oc', expiredEmbed).catch(() => {});

            consola.info(
                `[Blacklist] Expired and deactivated ${record.username} (${record.uuid})`
            );
        } catch (err) {
            consola.warn(`[Blacklist] Failed expiry handling for ${record.uuid}:`, err);
        }
    }
}

/**
 * Periodic guild scan: fetches the live Hypixel guild roster and cross-references
 * active blacklist UUIDs. Any match is kicked and has their blacklist extended by
 * BLACKLIST_REJOIN_EXTENSION_MONTHS months. Permanent entries are kicked but not extended.
 */
export async function runGuildScan(bridge: Bridge): Promise<void> {
    let active: BlacklistRecord[];
    try {
        active = await blacklistRepo.getAll();
    } catch (err) {
        consola.warn('[Blacklist] getAll failed during guild scan:', err);
        return;
    }
    if (active.length === 0) return;

    const guild = await hypixelService.getGuildByName(env.HYPIXEL_GUILD_NAME).catch(() => null);
    if (!guild) {
        consola.warn('[Blacklist] Guild scan: failed to fetch guild from Hypixel');
        return;
    }

    const norm = (u: string) => u.replace(/-/g, '').toLowerCase();
    const memberByUuid = new Map<string, { uuid: string; rank: string }>();
    for (const m of guild.members) memberByUuid.set(norm(m.uuid), m);

    const extensionMonths = env.BLACKLIST_REJOIN_EXTENSION_MONTHS;
    const addMs = extensionMonths * 30 * MS_PER_DAY; // approximate month length

    for (const record of active) {
        if (!memberByUuid.has(norm(record.uuid))) continue;

        try {
            // Resolve the freshest IGN (handles name changes since blacklist was added)
            const profile = await mojangService.getByUuid(record.uuid).catch(() => null);
            const ign = profile?.name ?? record.username;

            await enforceBlacklistKick(bridge, ign);

            let updated: BlacklistRecord | null = record;
            if (record.expires_at) {
                updated = await blacklistRepo
                    .extendExpiry(record.uuid, addMs)
                    .catch(() => record);
            }

            const newExpiry = updated?.expires_at ?? record.expires_at;
            if (newExpiry) {
                const rejoinEmbed = buildRejoinEmbed(updated ?? record, extensionMonths, newExpiry);
                await bridge.discord
                    .editBlacklistMessage(record.discord_message_id, rejoinEmbed)
                    .catch(() => false);
                await bridge.discord.sendEmbed('oc', rejoinEmbed).catch(() => {});
            } else {
                // Permanent entry — still announce the kick, no extension
                const embed = new EmbedBuilder()
                    .setColor('DarkRed')
                    .setTitle('Blacklisted Player Re-Joined — Auto-Kicked')
                    .setThumbnail(`https://mc-heads.net/avatar/${record.uuid}/64`)
                    .addFields(
                        { name: 'Player', value: `**${ign}**`, inline: true },
                        { name: 'Status', value: 'Permanent — no extension applied', inline: true },
                        { name: 'Reason', value: record.reason || 'No reason provided' }
                    )
                    .setTimestamp();
                await bridge.discord.sendEmbed('oc', embed).catch(() => {});
            }

            consola.info(
                `[Blacklist] Re-join enforcement: kicked ${ign} (${record.uuid}), ` +
                    (newExpiry ? `extended by ${extensionMonths} months` : 'permanent — no extension')
            );
        } catch (err) {
            consola.warn(
                `[Blacklist] Re-join enforcement failed for ${record.username} (${record.uuid}):`,
                err
            );
        }
    }
}
