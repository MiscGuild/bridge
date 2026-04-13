import { GuildMember } from 'discord.js';
import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';
import type { ModuleCommand } from '@/modules/types';
import { mutesRepo, warnsRepo } from '@/db/repositories/mutes.repo';
import { auditLogRepo } from '@/db/repositories/audit-log.repo';
import { mojangService } from '@/services/mojang';
import env from '@/config/env';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isStaff(guildRank?: string): boolean {
    if (!guildRank) return false;
    const norm = guildRank.replace(/[\[\]]/g, '').toLowerCase();
    return ['gm', 'leader', 'officer', 'mod', 'moderator'].includes(norm);
}

/**
 * Parse duration string like "1d", "2h", "30m" into an ISO expiry timestamp.
 * Returns null for permanent.
 */
function parseDuration(dur?: string): string | null {
    if (!dur) return null;
    const match = dur.match(/^(\d+)([mhd])$/i);
    if (!match) return null;
    const num = parseInt(match[1]!, 10);
    const unit = match[2]!.toLowerCase();
    const ms = unit === 'm' ? num * 60_000 : unit === 'h' ? num * 3_600_000 : num * 86_400_000;
    return new Date(Date.now() + ms).toISOString();
}

/** Format remaining duration for display */
function formatRemaining(expiresAt: string | null): string {
    if (!expiresAt) return 'permanent';
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return 'expired';
    const hours = Math.floor(remaining / 3_600_000);
    const mins = Math.floor((remaining % 3_600_000) / 60_000);
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

// ── Discord Role Sync ─────────────────────────────────────────────────────────

/**
 * Add or remove the Bridge-Muted role from a Discord member.
 * Silently skips if role ID not configured or member not found.
 */
export async function syncDiscordMuteRole(
    bridge: Bridge,
    discordId: string | null | undefined,
    muted: boolean
): Promise<void> {
    const roleId = env.BRIDGE_MUTED_ROLE_ID;
    if (!roleId || !discordId) return;

    try {
        const guild = bridge.discord.guilds.cache.first();
        if (!guild) return;
        const member = await guild.members.fetch(discordId).catch(() => null);
        if (!member) return;

        if (muted && !member.roles.cache.has(roleId)) {
            await member.roles.add(roleId, 'Bridge mute sync');
        } else if (!muted && member.roles.cache.has(roleId)) {
            await member.roles.remove(roleId, 'Bridge unmute sync');
        }
    } catch (err) {
        consola.warn('Failed to sync Discord mute role:', err);
    }
}

/**
 * Try to find a Discord member by their Minecraft username (display name match).
 * Returns member ID or null.
 */
export async function findDiscordMember(
    bridge: Bridge,
    mcUsername: string
): Promise<GuildMember | null> {
    try {
        const guild = bridge.discord.guilds.cache.first();
        if (!guild) return null;
        const members = await guild.members.fetch({ query: mcUsername, limit: 5 });
        return members.find(m =>
            m.displayName.toLowerCase() === mcUsername.toLowerCase() ||
            m.user.username.toLowerCase() === mcUsername.toLowerCase()
        ) ?? null;
    } catch {
        return null;
    }
}

// ── Handle in-game mute/unmute events (from chat parser) ──────────────────────

/**
 * Called when the chat parser detects a guild mute/unmute event.
 * Syncs to the mute repo and assigns/removes the Discord Bridge-Muted role.
 */
export async function handleMuteSyncFromGame(
    bridge: Bridge,
    action: 'muted' | 'unmuted',
    targetName: string,
    muterName: string,
    duration?: string
): Promise<void> {
    const profile = await mojangService.getProfile(targetName).catch(() => null);
    const uuid = profile?.id ?? '';

    if (action === 'muted') {
        const expiresAt = parseDuration(duration);
        const discordMember = await findDiscordMember(bridge, targetName);
        await mutesRepo.create({
            uuid,
            username: targetName,
            discord_id: discordMember?.id ?? null,
            reason: `Guild muted by ${muterName}${duration ? ` for ${duration}` : ''}`,
            muted_by: muterName,
            expires_at: expiresAt,
        }).catch(() => {});
        await syncDiscordMuteRole(bridge, discordMember?.id, true);
    } else {
        // Unmute: deactivate record and remove Discord role
        const existing = await mutesRepo.getByUsername(targetName).catch(() => null);
        await mutesRepo.deactivateByUsername(targetName).catch(() => {});
        const discordId = existing?.discord_id ?? (await findDiscordMember(bridge, targetName))?.id;
        await syncDiscordMuteRole(bridge, discordId, false);
    }
}

// ── In-game commands ──────────────────────────────────────────────────────────

export function registerMuteWarnModule(commands: ModuleCommand[]): void {

    // !mute <username> [duration] [reason]
    commands.push({
        commandId: 'mutewarn:mute',
        pattern: /^!mute\s+(\S+)(?:\s+(\d+[mhd]))?(?:\s+(.+))?/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!isStaff(ctx.guildRank)) {
                bridge.bot.chat('gc', `${ctx.username}, you don't have permission.`);
                return;
            }
            const target = ctx.matches[1]!;
            const duration = ctx.matches[2];
            const reason = ctx.matches[3] ?? 'No reason provided';

            // Execute Hypixel guild mute
            bridge.bot.execute(`/g mute ${target}${duration ? ` ${duration}` : ''}`);

            // Record in DB
            const profile = await mojangService.getProfile(target).catch(() => null);
            const discordMember = await findDiscordMember(bridge, target);
            await mutesRepo.create({
                uuid: profile?.id ?? '',
                username: target,
                discord_id: discordMember?.id ?? null,
                reason,
                muted_by: ctx.username,
                expires_at: parseDuration(duration),
            }).catch(() => {});

            // Sync Discord role
            await syncDiscordMuteRole(bridge, discordMember?.id, true);
            await auditLogRepo.log(ctx.username, 'mute', target, { duration, reason }).catch(() => {});

            bridge.bot.chat('oc', `🔇 ${ctx.username} muted ${target}${duration ? ` for ${duration}` : ''}: ${reason}`);
        },
    });

    // !unmute <username>
    commands.push({
        commandId: 'mutewarn:unmute',
        pattern: /^!unmute\s+(\S+)/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!isStaff(ctx.guildRank)) {
                bridge.bot.chat('gc', `${ctx.username}, you don't have permission.`);
                return;
            }
            const target = ctx.matches[1]!;

            bridge.bot.execute(`/g unmute ${target}`);

            const existing = await mutesRepo.getByUsername(target).catch(() => null);
            await mutesRepo.deactivateByUsername(target).catch(() => {});

            const discordId = existing?.discord_id ?? (await findDiscordMember(bridge, target))?.id;
            await syncDiscordMuteRole(bridge, discordId, false);
            await auditLogRepo.log(ctx.username, 'unmute', target).catch(() => {});

            bridge.bot.chat('oc', `✅ ${ctx.username} unmuted ${target}`);
        },
    });

    // !warn <username> <reason>
    commands.push({
        commandId: 'mutewarn:warn',
        pattern: /^!warn\s+(\S+)(?:\s+(.+))?/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!isStaff(ctx.guildRank)) {
                bridge.bot.chat('gc', `${ctx.username}, you don't have permission.`);
                return;
            }
            const target = ctx.matches[1]!;
            const reason = ctx.matches[2] ?? 'No reason provided';

            const profile = await mojangService.getProfile(target).catch(() => null);
            const discordMember = await findDiscordMember(bridge, target);
            await warnsRepo.create({
                uuid: profile?.id ?? '',
                username: target,
                discord_id: discordMember?.id ?? null,
                reason,
                warned_by: ctx.username,
            }).catch(() => {});

            const total = (await warnsRepo.getByUsername(target).catch(() => [])).length;
            await auditLogRepo.log(ctx.username, 'warn', target, { reason }).catch(() => {});

            bridge.bot.chat('gc', `⚠️ ${target} has been warned: ${reason} (${total} total)`);
        },
    });

    // !warns <username>
    commands.push({
        commandId: 'mutewarn:warns',
        pattern: /^!warns\s+(\S+)/i,
        async handler(ctx, bridge) {
            const target = ctx.matches[1]!;
            const warns = await warnsRepo.getByUsername(target).catch(() => []);
            if (warns.length === 0) {
                bridge.bot.chat('gc', `${target} has no warnings.`);
                return;
            }
            bridge.bot.chat('gc', `${target} has ${warns.length} warning(s):`);
            for (const w of warns.slice(-5)) {
                const date = new Date(w.warned_at).toLocaleDateString();
                bridge.bot.chat('gc', `• ${date} by ${w.warned_by}: ${w.reason}`);
            }
        },
    });

    // !clearwarns <username>
    commands.push({
        commandId: 'mutewarn:clearwarns',
        pattern: /^!clearwarns\s+(\S+)/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!isStaff(ctx.guildRank)) {
                bridge.bot.chat('gc', `${ctx.username}, you don't have permission.`);
                return;
            }
            const target = ctx.matches[1]!;
            const count = await warnsRepo.clearByUsername(target).catch(() => 0);
            await auditLogRepo.log(ctx.username, 'clearwarns', target).catch(() => {});
            bridge.bot.chat('oc', `✅ Cleared ${count} warning(s) for ${target}`);
        },
    });

    // !muteinfo <username> — check active mute
    commands.push({
        commandId: 'mutewarn:muteinfo',
        pattern: /^!muteinfo\s+(\S+)/i,
        async handler(ctx, bridge) {
            const target = ctx.matches[1]!;
            const mute = await mutesRepo.getByUsername(target).catch(() => null);
            if (!mute) {
                bridge.bot.chat('gc', `${target} is not muted.`);
                return;
            }
            bridge.bot.chat('gc', `🔇 ${target} muted by ${mute.muted_by} | Remaining: ${formatRemaining(mute.expires_at)} | ${mute.reason}`);
        },
    });
}
