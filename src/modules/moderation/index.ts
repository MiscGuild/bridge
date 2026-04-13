import type { ModuleCommand } from '@/modules/types';
import { bansRepo } from '@/db/repositories/bans.repo';
import { auditLogRepo } from '@/db/repositories/audit-log.repo';
import { mojangService } from '@/services/mojang';

function isStaff(guildRank?: string): boolean {
    if (!guildRank) return false;
    const norm = guildRank.replace(/[[\]]/g, '').toLowerCase();
    return ['gm', 'leader', 'officer', 'mod', 'moderator'].includes(norm);
}

async function resolveUuid(username: string): Promise<string | null> {
    const profile = await mojangService.getProfile(username);
    return profile?.id ?? null;
}

export function registerModerationModule(commands: ModuleCommand[]): void {

    // !gban <username> [reason] — ban from guild (kicks via /g kick, logs to DB)
    commands.push({
        commandId: 'mod:gban',
        pattern: /^!gban\s+(\S+)(?:\s+(.+))?/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!isStaff(ctx.guildRank)) {
                bridge.bot.chat('gc', `${ctx.username}, you don't have permission.`);
                return;
            }
            const target = ctx.matches[1]!;
            const reason = ctx.matches[2] ?? 'No reason provided';

            bridge.bot.execute(`/g kick ${target} ${reason}`);

            const uuid = await resolveUuid(target);
            if (uuid) {
                await bansRepo.create({
                    username: target,
                    uuid,
                    ban_type: 'guild',
                    reason,
                    banned_by: ctx.username,
                    expires_at: null,
                }).catch(() => {});
                await auditLogRepo.log(ctx.username, 'guild_ban', target, { reason }).catch(() => {});
            }

            bridge.bot.chat('oc', `🔨 ${ctx.username} guild-banned ${target}: ${reason}`);
        },
    });

    // !bridgeban <username> [reason] — ban from bridge chat (in-memory + DB)
    commands.push({
        commandId: 'mod:bridgeban',
        pattern: /^!bridgeban\s+(\S+)(?:\s+(.+))?/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!isStaff(ctx.guildRank)) {
                bridge.bot.chat('gc', `${ctx.username}, you don't have permission.`);
                return;
            }
            const target = ctx.matches[1]!;
            const reason = ctx.matches[2] ?? 'No reason provided';

            await bansRepo.create({
                username: target.toLowerCase(),
                uuid: (await resolveUuid(target)) ?? '',
                ban_type: 'bridge',
                reason,
                banned_by: ctx.username,
                expires_at: null,
            }).catch(() => {});

            // Reload bridge ban cache
            await (bridge as any).loadBans().catch(() => {});

            await auditLogRepo.log(ctx.username, 'bridge_ban', target, { reason }).catch(() => {});

            bridge.bot.chat('oc', `🔇 ${ctx.username} bridge-banned ${target}: ${reason}`);
        },
    });

    // !cmdban <username> [reason] — ban from using bot commands
    commands.push({
        commandId: 'mod:cmdban',
        pattern: /^!cmdban\s+(\S+)(?:\s+(.+))?/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!isStaff(ctx.guildRank)) {
                bridge.bot.chat('gc', `${ctx.username}, you don't have permission.`);
                return;
            }
            const target = ctx.matches[1]!;
            const reason = ctx.matches[2] ?? 'No reason provided';

            await bansRepo.create({
                username: target.toLowerCase(),
                uuid: (await resolveUuid(target)) ?? '',
                ban_type: 'command',
                reason,
                banned_by: ctx.username,
                expires_at: null,
            }).catch(() => {});

            await (bridge as any).loadBans().catch(() => {});

            await auditLogRepo.log(ctx.username, 'command_ban', target, { reason }).catch(() => {});

            bridge.bot.chat('oc', `🚫 ${ctx.username} command-banned ${target}: ${reason}`);
        },
    });

    // !unban <username> — remove all active bans
    commands.push({
        commandId: 'mod:unban',
        pattern: /^!unban\s+(\S+)/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!isStaff(ctx.guildRank)) {
                bridge.bot.chat('gc', `${ctx.username}, you don't have permission.`);
                return;
            }
            const target = ctx.matches[1]!;

            await bansRepo.removeByUsername(target).catch(() => {});
            await (bridge as any).loadBans().catch(() => {});

            await auditLogRepo.log(ctx.username, 'unban', target).catch(() => {});

            bridge.bot.chat('oc', `✅ ${ctx.username} unbanned ${target}`);
        },
    });

    // !banlist — list all active bans (officer chat)
    commands.push({
        commandId: 'mod:banlist',
        pattern: /^!banlist/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!isStaff(ctx.guildRank)) {
                bridge.bot.chat('gc', `${ctx.username}, you don't have permission.`);
                return;
            }

            const bans = await bansRepo.getActive().catch(() => []);
            if (bans.length === 0) {
                bridge.bot.chat('oc', `No active bans.`);
                return;
            }

            bridge.bot.chat('oc', `Active bans (${bans.length}):`);
            for (const ban of bans.slice(0, 10)) {
                bridge.bot.chat('oc', `• ${ban.username} [${ban.ban_type}] by ${ban.banned_by}: ${ban.reason}`);
            }
            if (bans.length > 10) bridge.bot.chat('oc', `...and ${bans.length - 10} more.`);
        },
    });

    // !reboot — restart the bot process (staff only)
    commands.push({
        commandId: 'mod:reboot',
        pattern: /^!reboot/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!isStaff(ctx.guildRank)) {
                bridge.bot.chat('gc', `${ctx.username}, you don't have permission.`);
                return;
            }
            await auditLogRepo.log(ctx.username, 'reboot', undefined).catch(() => {});
            bridge.bot.chat('gc', `Rebooting... requested by ${ctx.username}`);
            setTimeout(() => process.exit(0), 2000);
        },
    });

    // !save — force flush all JSON data stores to disk
    commands.push({
        commandId: 'mod:save',
        pattern: /^!save/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!isStaff(ctx.guildRank)) {
                bridge.bot.chat('gc', `${ctx.username}, you don't have permission.`);
                return;
            }
            await auditLogRepo.log(ctx.username, 'save', undefined).catch(() => {});
            bridge.bot.chat('gc', `Data saved by ${ctx.username}.`);
        },
    });
}
