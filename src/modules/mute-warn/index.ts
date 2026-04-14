import { GuildMember } from 'discord.js';
import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';
import type { ModuleCommand } from '@/modules/types';
import { mutesRepo, warnsRepo } from '@/db/repositories/mutes.repo';
import { auditLogRepo } from '@/db/repositories/audit-log.repo';
import { mojangService } from '@/services/mojang';
import env from '@/config/env';
import { guildRankService } from '@/services/guild-ranks';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse duration string like "1d", "2h", "30m" into an ISO expiry timestamp.
 * Returns null for permanent.
 */
export function parseDuration(dur?: string): string | null {
    if (!dur) return null;
    const match = dur.match(/^(\d+)([mhd])$/i);
    if (!match) return null;
    const num = parseInt(match[1]!, 10);
    const unit = match[2]!.toLowerCase();
    const ms = unit === 'm' ? num * 60_000 : unit === 'h' ? num * 3_600_000 : num * 86_400_000;
    return new Date(Date.now() + ms).toISOString();
}

/** Format remaining duration for display */
export function formatRemaining(expiresAt: string | null): string {
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
 * Add or remove the Muted role from a Discord member on guild mute/unmute.
 * This is the full server mute role, separate from Bridge-Muted.
 * Silently skips if role ID not configured or member not found.
 */
export async function syncDiscordMuteRole(
    bridge: Bridge,
    discordId: string | null | undefined,
    muted: boolean
): Promise<void> {
    const roleId = env.MUTED_ROLE_ID;
    if (!roleId || !discordId) return;

    try {
        const guild = bridge.discord.guilds.cache.first();
        if (!guild) return;
        const member = await guild.members.fetch(discordId).catch(() => null);
        if (!member) return;

        if (muted && !member.roles.cache.has(roleId)) {
            await member.roles.add(roleId, 'Guild mute sync');
        } else if (!muted && member.roles.cache.has(roleId)) {
            await member.roles.remove(roleId, 'Guild unmute sync');
        }
    } catch (err) {
        consola.warn('Failed to sync Discord mute role:', err);
    }
}

/**
 * Try to find a Discord member by their Minecraft username (display name match).
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

/**
 * DM a Discord user about a mute or warn.
 * Returns true if the DM was sent successfully, false if DMs are disabled.
 */
export async function dmUser(
    bridge: Bridge,
    discordId: string | null | undefined,
    message: string
): Promise<boolean> {
    if (!discordId) return false;
    try {
        const user = await bridge.discord.users.fetch(discordId).catch(() => null);
        if (!user) return false;
        await user.send(message);
        return true;
    } catch {
        return false;
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
    consola.info(`[mute-sync] ${action} ${targetName} by ${muterName} (duration: ${duration ?? 'none'})`);
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
        await dmUser(bridge, discordMember?.id,
            `🔇 You have been muted in the guild by **${muterName}**${duration ? ` for ${duration}` : ''}. You cannot use the bridge chat while muted.`
        );
    } else {
        const existing = await mutesRepo.getByUsername(targetName).catch(() => null);
        await mutesRepo.deactivateByUsername(targetName).catch(() => {});
        const discordId = existing?.discord_id ?? (await findDiscordMember(bridge, targetName))?.id;
        await syncDiscordMuteRole(bridge, discordId, false);
        await dmUser(bridge, discordId,
            `✅ You have been unmuted in the guild by **${muterName}**. You can use the bridge chat again.`
        );
    }
}

// ── In-game commands (OC-only for moderation, GC for info) ────────────────────

export function registerMuteWarnModule(commands: ModuleCommand[]): void {

    // !warn <username> <reason> — Officer Chat only
    commands.push({
        commandId: 'mutewarn:warn',
        pattern: /^!warn\s+(\S+)(?:\s+(.+))?/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (ctx.channel !== 'Officer') {
                bridge.bot.chat(ctx.replyChannel, `${ctx.username}, !warn can only be used in Officer Chat.`);
                return;
            }
            if (!guildRankService.isStaffRank(ctx.guildRank)) {
                bridge.bot.chat('oc', `${ctx.username}, you don't have permission.`);
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

            // 1. In-game /msg to the offender; fall back to GC if offline/blocked
            let igStatus = 'IG DM';
            try {
                await bridge.bot.executeAndCapture(`/msg ${target} You have been warned in the guild for: ${reason} (${total} total)`);
            } catch {
                igStatus = 'IG FAIL';
                bridge.bot.chat('gc', `${target}, you have been warned by ${ctx.username}: ${reason} (${total} total)`);
            }

            // 2. Discord DM; silently fail if DMs are off
            let dcStatus = 'DC DM';
            const dmText = `⚠️ You have received a warning from **${ctx.username}**: ${reason}\nTotal warnings: ${total}`;
            const dmSent = await dmUser(bridge, discordMember?.id, dmText);
            if (!dmSent) {
                dcStatus = 'DC FAIL';
            }

            // 3. Confirm in OC with delivery status
            bridge.bot.chat('oc', `Warned: ${target} For: ${reason} By: ${ctx.username} Status: ${dcStatus} & ${igStatus}`);
        },
    });

    // !warns <username> — viewable in both GC and OC
    commands.push({
        commandId: 'mutewarn:warns',
        pattern: /^!warns\s+(\S+)/i,
        async handler(ctx, bridge) {
            const target = ctx.matches[1]!;
            const channel = ctx.channel === 'Officer' ? 'oc' : 'gc';
            const warns = await warnsRepo.getByUsername(target).catch(() => []);
            if (warns.length === 0) {
                bridge.bot.chat(channel, `${target} has no warnings.`);
                return;
            }
            bridge.bot.chat(channel, `${target} has ${warns.length} warning(s):`);
            for (const w of warns.slice(-5)) {
                const date = new Date(w.warned_at).toLocaleDateString();
                bridge.bot.chat(channel, `• ${date} by ${w.warned_by}: ${w.reason}`);
            }
        },
    });

    // !clearwarns <username> — Officer Chat only
    commands.push({
        commandId: 'mutewarn:clearwarns',
        pattern: /^!clearwarns\s+(\S+)/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (ctx.channel !== 'Officer') {
                bridge.bot.chat(ctx.replyChannel, `${ctx.username}, !clearwarns can only be used in Officer Chat.`);
                return;
            }
            if (!guildRankService.isStaffRank(ctx.guildRank)) {
                bridge.bot.chat('oc', `${ctx.username}, you don't have permission.`);
                return;
            }
            const target = ctx.matches[1]!;
            const count = await warnsRepo.clearByUsername(target).catch(() => 0);
            await auditLogRepo.log(ctx.username, 'clearwarns', target).catch(() => {});
            bridge.bot.chat('oc', `✅ Cleared ${count} warning(s) for ${target}`);
        },
    });

    // !ismuted <username> — viewable in both GC and OC
    commands.push({
        commandId: 'mutewarn:ismuted',
        pattern: /^!ismuted\s+(\S+)/i,
        async handler(ctx, bridge) {
            const target = ctx.matches[1]!;
            const channel = ctx.channel === 'Officer' ? 'oc' : 'gc';
            const mute = await mutesRepo.getByUsername(target).catch(() => null);
            if (!mute) {
                bridge.bot.chat(channel, `${target} is not muted.`);
                return;
            }
            bridge.bot.chat(channel, `🔇 ${target} muted by ${mute.muted_by} | Remaining: ${formatRemaining(mute.expires_at)} | ${mute.reason}`);
        },
    });
}
