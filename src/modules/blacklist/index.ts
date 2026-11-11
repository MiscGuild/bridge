import { EmbedBuilder, type TextChannel } from 'discord.js';
import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';
import env from '@/config/env';
import { blacklistRepo, type BlacklistRecord } from '@/db/repositories/blacklist.repo';
import type { ModuleCommand } from '@/modules/types';
import messageQueue from '@/queue/message-queue';
import { getPlayerTags } from '@/services/coral';
import { hypixelService } from '@/services/hypixel';
import { mojangService } from '@/services/mojang';
import cooldowns, { replyIfOnCooldown } from '@/util/cooldown';
import { discordTimestamp, randomHex } from '@/util/formatting';

/**
 * The guild blacklist: adding, removing and enforcing it. Used by the in-game
 * commands below and by the `/blacklist` slash command.
 */

export type KickResult = 'kicked' | 'not_in_guild' | 'kick_failed';

export const KICK_RESULT_TEXT: Record<KickResult, string> = {
    kicked: 'Kicked from guild',
    kick_failed: 'Kick failed',
    not_in_guild: 'Not in guild',
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DURATION_UNIT_MS: Record<string, number> = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: MS_PER_DAY,
    w: 7 * MS_PER_DAY,
};

/** Turn a duration like `30m`, `12h`, `7d` or `2w` into an ISO expiry date. Null if invalid. */
export function parseExpiry(duration: string): string | null {
    const match = duration.match(/^(\d+)([mhdw])$/i);
    if (!match) return null;
    const ms = parseInt(match[1]!, 10) * DURATION_UNIT_MS[match[2]!.toLowerCase()]!;
    return new Date(Date.now() + ms).toISOString();
}

/** The moderator as shown in blacklist embeds (hidden when BLACKLIST_ANONYMOUS=true). */
function moderatorName(name: string): string {
    return env.BLACKLIST_ANONYMOUS ? 'Miscellaneous Staff' : name;
}

function avatarUrl(uuid: string): string {
    return `https://mc-heads.net/avatar/${uuid}/64`;
}

// ── Embeds ───────────────────────────────────────────────────────────────────

function addedEmbed(
    name: string,
    uuid: string,
    addedBy: string,
    reason: string,
    expiresAt: string | null
): EmbedBuilder {
    const now = new Date();
    return new EmbedBuilder()
        .setColor('Red')
        .setTitle('Player Blacklisted')
        .setThumbnail(avatarUrl(uuid))
        .addFields(
            { name: 'Player', value: `**${name}**`, inline: true },
            { name: 'Added by', value: moderatorName(addedBy), inline: true },
            { name: 'Reason', value: reason },
            { name: 'Added', value: discordTimestamp(now), inline: true },
            {
                name: 'Expires',
                value: expiresAt
                    ? `${discordTimestamp(expiresAt)} (${discordTimestamp(expiresAt, 'R')})`
                    : 'Never (Permanent)',
                inline: true,
            }
        )
        .setTimestamp(now);
}

function removedEmbed(name: string, uuid: string, removedBy: string): EmbedBuilder {
    const now = new Date();
    return new EmbedBuilder()
        .setColor('Green')
        .setTitle('Player Removed from Blacklist')
        .setThumbnail(avatarUrl(uuid))
        .addFields(
            { name: 'Player', value: `**${name}**`, inline: true },
            { name: 'Removed by', value: moderatorName(removedBy), inline: true },
            { name: 'Removed', value: discordTimestamp(now), inline: true }
        )
        .setTimestamp(now);
}

/** Replaces the original log message once the entry expires. */
function expiredEmbed(record: BlacklistRecord): EmbedBuilder {
    const now = new Date();
    return new EmbedBuilder()
        .setColor('Grey')
        .setTitle('Blacklist Expired')
        .setThumbnail(avatarUrl(record.uuid))
        .addFields(
            { name: 'Player', value: `**${record.username}**`, inline: true },
            { name: 'Originally added by', value: moderatorName(record.added_by), inline: true },
            { name: 'Reason', value: record.reason || 'No reason provided' },
            { name: 'Added', value: discordTimestamp(record.added_at), inline: true },
            {
                name: 'Expired',
                value: `${discordTimestamp(record.expires_at ?? now)} (auto-removed)`,
                inline: true,
            }
        )
        .setTimestamp(now);
}

/** A temporarily blacklisted player got back into the guild and their expiry was extended. */
function rejoinEmbed(
    record: BlacklistRecord,
    extensionMonths: number,
    newExpiresAt: string
): EmbedBuilder {
    const now = new Date();
    return new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle('Blacklisted Player Re-Joined — Auto-Kicked')
        .setThumbnail(avatarUrl(record.uuid))
        .addFields(
            { name: 'Player', value: `**${record.username}**`, inline: true },
            { name: 'Originally added by', value: moderatorName(record.added_by), inline: true },
            { name: 'Reason', value: record.reason || 'No reason provided' },
            { name: 'Added', value: discordTimestamp(record.added_at), inline: true },
            {
                name: 'New Expiry',
                value: `${discordTimestamp(newExpiresAt)} (${discordTimestamp(newExpiresAt, 'R')})`,
                inline: true,
            },
            {
                name: 'Re-Join Detected',
                value: `${discordTimestamp(now)} — extended by **${extensionMonths} month${extensionMonths === 1 ? '' : 's'}**`,
            }
        )
        .setTimestamp(now);
}

/** A permanently blacklisted player got back into the guild. */
function permanentRejoinEmbed(record: BlacklistRecord, ign: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle('Blacklisted Player Re-Joined — Auto-Kicked')
        .setThumbnail(avatarUrl(record.uuid))
        .addFields(
            { name: 'Player', value: `**${ign}**`, inline: true },
            { name: 'Status', value: 'Permanent — no extension applied', inline: true },
            { name: 'Reason', value: record.reason || 'No reason provided' }
        )
        .setTimestamp();
}

/** Post to BLACKLIST_CHANNEL_ID. Returns the message id, or null if it couldn't be sent. */
async function postToBlacklistChannel(bridge: Bridge, embed: EmbedBuilder): Promise<string | null> {
    try {
        const channel = await bridge.discord.channels
            .fetch(env.BLACKLIST_CHANNEL_ID)
            .catch(() => null);
        if (!channel || !channel.isTextBased()) return null;
        const sent = await (channel as TextChannel).send({ embeds: [embed] });
        return sent.id;
    } catch {
        return null;
    }
}

// ── Kicking ──────────────────────────────────────────────────────────────────

/**
 * Aggressively enforce a blacklist kick. The Hypixel queue is paused (so no
 * other queued chat messages can interleave and slow us down), then `/g kick`
 * is sent up to 3 times with a 5-second gap between attempts. Returns early
 * as soon as we observe a "was kicked / left the guild" confirmation for the
 * target. The queue is always resumed in the finally block.
 */
export async function enforceBlacklistKick(
    bridge: Bridge,
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

    consola.info(
        `[Blacklist] enforceBlacklistKick start: ${playerName} (queueSize=${messageQueue.size})`
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
            consola.info(`[Blacklist] confirmation matched: ${str.trim()}`);
            confirmed = true;
            confirmResolve?.();
        }
    };

    // Keep a reference: a reconnect replaces bridge.bot.bot, and we must detach from this one
    const mcBot = bridge.bot.bot;
    mcBot.on('message', listener);

    messageQueue.pause();
    consola.debug('[Blacklist] message queue paused');
    try {
        for (let attempt = 1; attempt <= 3 && !confirmed; attempt++) {
            consola.info(`[Blacklist] kick attempt ${attempt}/3: ${command}`);
            try {
                messageQueue.sendDirect(command);
            } catch (err) {
                consola.warn(`[Blacklist] kick attempt ${attempt} send failed:`, err);
            }

            const waitStart = Date.now();
            await Promise.race([confirmPromise, new Promise<void>((r) => setTimeout(r, 5000))]);
            consola.debug(
                `[Blacklist] attempt ${attempt} wait done after ${Date.now() - waitStart}ms (confirmed=${confirmed})`
            );
        }
    } finally {
        mcBot.removeListener('message', listener);
        messageQueue.resume();
        consola.info(
            `[Blacklist] enforceBlacklistKick finished: ${playerName} confirmed=${confirmed}`
        );
    }

    return confirmed;
}

/** Kick the player if they're currently in the guild. */
async function kickIfInGuild(
    bridge: Bridge,
    playerName: string,
    playerUuid: string
): Promise<KickResult> {
    try {
        const guild = await hypixelService.getGuildByName(env.HYPIXEL_GUILD_NAME);
        if (!guild) return 'not_in_guild';

        const uuid = playerUuid.replace(/-/g, '');
        if (!guild.members.some((m) => m.uuid.replace(/-/g, '') === uuid)) return 'not_in_guild';

        return (await enforceBlacklistKick(bridge, playerName)) ? 'kicked' : 'kick_failed';
    } catch {
        return 'kick_failed';
    }
}

// ── Adding & removing ────────────────────────────────────────────────────────

/** Blacklist a player, kick them if they're in the guild, and log it in BLACKLIST_CHANNEL_ID. */
export async function addToBlacklist(
    bridge: Bridge,
    entry: {
        uuid: string;
        username: string;
        reason: string;
        addedBy: string;
        expiresAt: string | null;
    }
): Promise<KickResult> {
    await blacklistRepo.add({
        uuid: entry.uuid,
        username: entry.username,
        reason: entry.reason,
        added_by: entry.addedBy,
        expires_at: entry.expiresAt,
    });

    const kickResult = await kickIfInGuild(bridge, entry.username, entry.uuid);

    const messageId = await postToBlacklistChannel(
        bridge,
        addedEmbed(entry.username, entry.uuid, entry.addedBy, entry.reason, entry.expiresAt)
    );
    // Saved so the log message can be updated when the entry expires or the player re-joins
    if (messageId) await blacklistRepo.setDiscordMessageId(entry.uuid, messageId).catch(() => {});

    return kickResult;
}

/** Lift a player's blacklist and log it in BLACKLIST_CHANNEL_ID. */
export async function removeFromBlacklist(
    bridge: Bridge,
    entry: { uuid: string; username: string; removedBy: string }
): Promise<void> {
    await blacklistRepo.remove(entry.uuid);
    await postToBlacklistChannel(bridge, removedEmbed(entry.username, entry.uuid, entry.removedBy));
}

// ── In-game commands ─────────────────────────────────────────────────────────

export function registerBlacklistModule(commands: ModuleCommand[]): void {
    // !view [player] — check the internal blacklist and Coral tags (yourself if no player)
    commands.push({
        commandId: 'blacklist:view',
        pattern: /^!view(?:\s+(\S+))?/i,
        async handler(ctx, bridge) {
            if (replyIfOnCooldown(ctx, bridge, 'coral', ` | ${randomHex()}`)) return;

            const target = ctx.matches[1]?.trim() ?? ctx.username;
            const profile = await mojangService.getProfile(target);
            if (!profile) {
                bridge.bot.chat(
                    ctx.replyChannel,
                    `[NOT-TAGGED] ${target} is not a valid Minecraft username. | ${randomHex()}`
                );
                return;
            }

            cooldowns.setCooldown(ctx.username, 'coral', ctx.guildRank);

            const internalEntry = await blacklistRepo.getByUuid(profile.id).catch(() => null);
            if (internalEntry) {
                bridge.bot.chat(
                    ctx.replyChannel,
                    `[INTERNAL] ${profile.name} - ${internalEntry.reason ?? 'No reason'} | ${randomHex()}`
                );
            }

            const tags = await getPlayerTags(profile.id);

            if (tags === null) {
                if (!internalEntry) {
                    bridge.bot.chat(
                        ctx.replyChannel,
                        `[ERROR] Failed to check blacklist for ${profile.name}. Try again later. | ${randomHex()}`
                    );
                }
                return;
            }

            if (tags.length === 0) {
                if (!internalEntry) {
                    bridge.bot.chat(
                        ctx.replyChannel,
                        `[NOT-TAGGED] ${profile.name} has no tags in the blacklist. | ${randomHex()}`
                    );
                }
                return;
            }

            for (const tag of tags) {
                const tagType = (tag.type || 'UNKNOWN').toUpperCase().replace(/ /g, '-');
                const reason = tag.reason || 'No reason given';
                let msg = `[${tagType}] ${profile.name} - ${reason} | ${randomHex()}`;
                if (msg.length > 200) msg = msg.slice(0, 197) + '...';
                bridge.bot.chat(ctx.replyChannel, msg);
            }
        },
    });

    // !guild-ban <player> [duration] [reason] — blacklist and kick. Aliases: !gban, !blacklist add
    commands.push({
        commandId: 'blacklist:add',
        pattern: /^!(?:guild-ban|gban|blacklist\s+add)\s+(\S+)(?:\s+(\d+[mhdw]))?(?:\s+(.+))?/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            const target = ctx.matches[1]!;
            const duration = ctx.matches[2];
            const reason = ctx.matches[3] ?? 'No reason provided';

            const profile = await mojangService.getProfile(target);
            if (!profile) {
                bridge.bot.chat(ctx.replyChannel, `Player not found: ${target}`);
                return;
            }

            const expiresAt = duration ? parseExpiry(duration) : null;
            const kickResult = await addToBlacklist(bridge, {
                uuid: profile.id,
                username: profile.name,
                reason,
                addedBy: ctx.username,
                expiresAt,
            });

            const expiry = expiresAt ? ` (expires in ${duration})` : ' (permanent)';
            const kick = kickResult === 'not_in_guild' ? '' : ` | ${KICK_RESULT_TEXT[kickResult]}`;
            bridge.bot.chat(
                'oc',
                `${profile.name} added to internal blacklist: ${reason}${expiry}${kick}`
            );
        },
    });

    // !blacklist remove <player> — lift a blacklist. Alias: !unban
    commands.push({
        commandId: 'blacklist:remove',
        pattern: /^!(?:unban|blacklist\s+remove)\s+(\S+)/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            const target = ctx.matches[1]!;
            const profile = await mojangService.getProfile(target);
            if (!profile) {
                bridge.bot.chat(ctx.replyChannel, `Player not found: ${target}`);
                return;
            }

            await removeFromBlacklist(bridge, {
                uuid: profile.id,
                username: profile.name,
                removedBy: ctx.username,
            });
            bridge.bot.chat('oc', `${profile.name} removed from internal blacklist.`);
        },
    });
}

// ── Scheduled jobs ───────────────────────────────────────────────────────────

/**
 * Lift entries whose expiry has passed: edit the original log message and
 * announce it in officer chat.
 */
export async function runExpirySweep(bridge: Bridge): Promise<void> {
    let expired: BlacklistRecord[];
    try {
        expired = await blacklistRepo.expireOverdue();
    } catch (err) {
        consola.warn('[Blacklist] expireOverdue failed:', err);
        return;
    }

    for (const record of expired) {
        try {
            const embed = expiredEmbed(record);
            await bridge.discord
                .editBlacklistMessage(record.discord_message_id, embed)
                .catch(() => false);
            await bridge.discord.sendEmbed('oc', embed).catch(() => {});
            consola.info(`[Blacklist] Expired and deactivated ${record.username} (${record.uuid})`);
        } catch (err) {
            consola.warn(`[Blacklist] Failed expiry handling for ${record.uuid}:`, err);
        }
    }
}

/**
 * Compare the live Hypixel guild roster against the blacklist. Anyone found is kicked,
 * and a temporary blacklist is extended by BLACKLIST_REJOIN_EXTENSION_MONTHS.
 */
export async function runGuildScan(bridge: Bridge): Promise<void> {
    consola.debug('[Blacklist] Guild scan starting');
    let active: BlacklistRecord[];
    try {
        active = await blacklistRepo.getAll();
    } catch (err) {
        consola.warn('[Blacklist] getAll failed during guild scan:', err);
        return;
    }
    if (active.length === 0) {
        consola.debug('[Blacklist] Guild scan: no active blacklist entries');
        return;
    }

    const guild = await hypixelService.getGuildByName(env.HYPIXEL_GUILD_NAME).catch(() => null);
    if (!guild) {
        consola.warn('[Blacklist] Guild scan: failed to fetch guild from Hypixel');
        return;
    }

    const norm = (u: string) => u.replace(/-/g, '').toLowerCase();
    const memberUuids = new Set(guild.members.map((m) => norm(m.uuid)));
    const matches = active.filter((r) => memberUuids.has(norm(r.uuid)));
    consola.info(
        `[Blacklist] Guild scan: ${active.length} active entries vs ${guild.members.length} guild members — ${matches.length} match(es)`
    );

    const extensionMonths = env.BLACKLIST_REJOIN_EXTENSION_MONTHS;
    const addMs = extensionMonths * 30 * MS_PER_DAY; // approximate month length

    for (const record of matches) {
        consola.warn(
            `[Blacklist] Guild scan match: ${record.username} (${record.uuid}) is currently in the guild`
        );

        try {
            // Resolve the current IGN (handles name changes since they were blacklisted)
            const profile = await mojangService.getByUuid(record.uuid).catch(() => null);
            const ign = profile?.name ?? record.username;

            await enforceBlacklistKick(bridge, ign);

            const updated = record.expires_at
                ? await blacklistRepo.extendExpiry(record.uuid, addMs).catch(() => record)
                : record;
            const newExpiry = updated?.expires_at ?? record.expires_at;

            if (newExpiry) {
                const embed = rejoinEmbed(updated ?? record, extensionMonths, newExpiry);
                await bridge.discord
                    .editBlacklistMessage(record.discord_message_id, embed)
                    .catch(() => false);
                await bridge.discord.sendEmbed('oc', embed).catch(() => {});
            } else {
                await bridge.discord
                    .sendEmbed('oc', permanentRejoinEmbed(record, ign))
                    .catch(() => {});
            }

            consola.info(
                `[Blacklist] Re-join enforcement: kicked ${ign} (${record.uuid}), ` +
                    (newExpiry
                        ? `extended by ${extensionMonths} months`
                        : 'permanent — no extension')
            );
        } catch (err) {
            consola.warn(
                `[Blacklist] Re-join enforcement failed for ${record.username} (${record.uuid}):`,
                err
            );
        }
    }
}
