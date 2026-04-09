import type Bridge from '@/bridge/bridge';
import type { ModuleCommand } from '@/modules/types';
import { blacklistRepo } from '@/db/repositories/blacklist.repo';
import { mojangService } from '@/services/mojang';
import cooldowns from '@/util/cooldown';

interface UrchinTag {
    tag: string;
    type: string;
    description?: string;
}

interface UrchinResponse {
    uuid: string;
    username: string;
    tags: UrchinTag[];
    banned: boolean;
}

async function checkUrchin(uuid: string): Promise<UrchinResponse | null> {
    const urchinApiKey = process.env['URCHIN_API_KEY'];
    if (!urchinApiKey) return null;
    try {
        const res = await fetch(`https://api.urchin.gg/v1/player/${uuid}`, {
            headers: {
                Authorization: `Bearer ${urchinApiKey}`,
                'User-Agent': 'BridgeBot/2.0',
            },
        });
        if (!res.ok) return null;
        return await res.json() as UrchinResponse;
    } catch {
        return null;
    }
}

export function registerBlacklistModule(commands: ModuleCommand[]): void {

    // !view <username> — check Urchin tags + internal blacklist
    commands.push({
        commandId: 'blacklist:view',
        pattern: /^!view\s+(\S+)$/i,
        async handler(ctx, bridge) {
            const remaining = cooldowns.isOnCooldown(ctx.username, ctx.guildRank, 'urchin');
            if (remaining > 0) {
                bridge.bot.chat('gc', `${ctx.username}, cooldown: ${remaining}s`);
                return;
            }

            const target = ctx.matches[1]!;
            const profile = await mojangService.getProfile(target);
            if (!profile) {
                bridge.bot.chat('gc', `Could not find player: ${target}`);
                return;
            }

            cooldowns.setCooldown(ctx.username, 'urchin', ctx.guildRank);

            // Internal blacklist check
            const internalEntry = await blacklistRepo.getByUuid(profile.id).catch(() => null);

            // Urchin API check
            const urchin = await checkUrchin(profile.id);

            const parts: string[] = [`[${profile.name}]`];

            if (internalEntry) {
                parts.push(`INTERNAL BLACKLIST: ${internalEntry.reason ?? 'No reason'}`);
            }

            if (urchin) {
                if (urchin.banned) {
                    parts.push(`URCHIN BANNED`);
                }
                if (urchin.tags.length > 0) {
                    parts.push(`Tags: ${urchin.tags.map(t => t.tag).join(', ')}`);
                }
                if (!urchin.banned && urchin.tags.length === 0 && !internalEntry) {
                    parts.push(`Clean`);
                }
            } else if (!internalEntry) {
                parts.push(`Not blacklisted`);
            }

            bridge.bot.chat('gc', parts.join(' | '));
        },
    });

    // !blacklist add <username> [reason] — add to internal blacklist (staff only)
    commands.push({
        commandId: 'blacklist:add',
        pattern: /^!blacklist\s+add\s+(\S+)(?:\s+(.+))?$/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            const rank = ctx.guildRank?.replace(/[\[\]]/g, '').toLowerCase() ?? '';
            if (!['gm', 'leader', 'officer', 'mod', 'moderator'].includes(rank)) {
                bridge.bot.chat('gc', `${ctx.username}, you don't have permission.`);
                return;
            }

            const target = ctx.matches[1]!;
            const reason = ctx.matches[2] ?? 'No reason provided';
            const profile = await mojangService.getProfile(target);
            if (!profile) {
                bridge.bot.chat('gc', `Player not found: ${target}`);
                return;
            }

            await blacklistRepo.add({ uuid: profile.id, username: profile.name, reason, added_by: ctx.username }).catch(() => {});
            bridge.blacklist.add(profile.id);
            bridge.bot.chat('oc', `✅ ${profile.name} added to internal blacklist: ${reason}`);
        },
    });

    // !blacklist remove <username> — remove from internal blacklist (staff only)
    commands.push({
        commandId: 'blacklist:remove',
        pattern: /^!blacklist\s+remove\s+(\S+)$/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            const rank = ctx.guildRank?.replace(/[\[\]]/g, '').toLowerCase() ?? '';
            if (!['gm', 'leader', 'officer', 'mod', 'moderator'].includes(rank)) {
                bridge.bot.chat('gc', `${ctx.username}, you don't have permission.`);
                return;
            }

            const target = ctx.matches[1]!;
            const profile = await mojangService.getProfile(target);
            if (!profile) {
                bridge.bot.chat('gc', `Player not found: ${target}`);
                return;
            }

            await blacklistRepo.remove(profile.id).catch(() => {});
            bridge.blacklist.remove(profile.id);
            bridge.bot.chat('oc', `✅ ${profile.name} removed from internal blacklist.`);
        },
    });
}
