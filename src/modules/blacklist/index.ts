import type { ModuleCommand } from '@/modules/types';
import { blacklistRepo } from '@/db/repositories/blacklist.repo';
import { mojangService } from '@/services/mojang';
import { EmbedBuilder, TextChannel } from 'discord.js';
import cooldowns from '@/util/cooldown';
import env from '@/config/env';
import { guildRankService } from '@/services/guild-ranks';

interface UrchinTag {
    type: string;
    reason?: string;
}

interface UrchinResponse {
    tags?: UrchinTag[];
}

function hex(): string {
    return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
}

/** Discord timestamp: <t:UNIX:style> */
function discordTs(date: Date | string | null, style: 'f' | 'R' | 'F' | 'd' | 'D' | 'T' | 't' = 'f'): string {
    if (!date) return 'Never';
    const unix = Math.floor(new Date(date).getTime() / 1000);
    return `<t:${unix}:${style}>`;
}

/** Send a blacklist action embed to the configured log channel */
async function sendBlacklistLog(
    bridge: any,
    action: 'added' | 'removed',
    playerName: string,
    playerUuid: string,
    addedBy: string,
    reason?: string,
    expiresAt?: string | null
): Promise<void> {
    const channelId = env.BLACKLIST_CHANNEL_ID;
    if (!channelId) return;
    try {
        const channel = await bridge.discord.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) return;

        const displayName = env.BLACKLIST_ANONYMOUS ? 'Miscellaneous Staff' : addedBy;
        const now = new Date();
        const embed = new EmbedBuilder()
            .setThumbnail(`https://mc-heads.net/avatar/${playerUuid}/64`)
            .setTimestamp(now);

        if (action === 'added') {
            embed.setColor('Red')
                .setTitle('🚫 Player Blacklisted')
                .addFields(
                    { name: 'Player', value: `**${playerName}**`, inline: true },
                    { name: 'Added by', value: displayName, inline: true },
                    { name: 'Reason', value: reason ?? 'No reason provided' },
                    { name: 'Added', value: discordTs(now, 'f'), inline: true },
                    { name: 'Expires', value: expiresAt ? discordTs(expiresAt, 'f') + ` (${discordTs(expiresAt, 'R')})` : 'Never (Permanent)', inline: true },
                );
        } else {
            embed.setColor('Green')
                .setTitle('✅ Player Removed from Blacklist')
                .addFields(
                    { name: 'Player', value: `**${playerName}**`, inline: true },
                    { name: 'Removed by', value: displayName, inline: true },
                    { name: 'Removed', value: discordTs(now, 'f'), inline: true },
                );
        }

        await (channel as TextChannel).send({ embeds: [embed] });
    } catch {
        // Silently fail
    }
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
        return await res.json() as UrchinResponse;
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
    return data?.tags?.map(t => t.type) ?? [];
}

export function registerBlacklistModule(commands: ModuleCommand[]): void {

    // !view [username] — check Urchin tags + internal blacklist (self if no arg)
    commands.push({
        commandId: 'blacklist:view',
        pattern: /^!view(?:\s+(\S+))?/i,
        async handler(ctx, bridge) {
            const remaining = cooldowns.isOnCooldown(ctx.username, ctx.guildRank, 'urchin');
            if (remaining > 0) {
                bridge.bot.chat(ctx.replyChannel, `${ctx.username}, cooldown: ${remaining}s | ${hex()}`);
                return;
            }

            const target = ctx.matches[1]?.trim() ?? ctx.username;
            const profile = await mojangService.getProfile(target);
            if (!profile) {
                bridge.bot.chat(ctx.replyChannel, `[NOT-TAGGED] ${target} is not a valid Minecraft username. | ${hex()}`);
                return;
            }

            cooldowns.setCooldown(ctx.username, 'urchin', ctx.guildRank);

            // Internal blacklist check
            const internalEntry = await blacklistRepo.getByUuid(profile.id).catch(() => null);
            if (internalEntry) {
                bridge.bot.chat(ctx.replyChannel, `[INTERNAL] ${profile.name} - ${internalEntry.reason ?? 'No reason'} | ${hex()}`);
            }

            // Urchin API check
            const urchin = await queryUrchin(profile.id);

            if (!urchin) {
                if (!internalEntry) {
                    bridge.bot.chat(ctx.replyChannel, `[ERROR] Failed to check blacklist for ${profile.name}. Try again later. | ${hex()}`);
                }
                return;
            }

            if (!urchin.tags || urchin.tags.length === 0) {
                if (!internalEntry) {
                    bridge.bot.chat(ctx.replyChannel, `[NOT-TAGGED] ${profile.name} has no tags in the blacklist. | ${hex()}`);
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
                    const ms = unit === 'm' ? num * 60_000 : unit === 'h' ? num * 3_600_000 : unit === 'd' ? num * 86_400_000 : num * 7 * 86_400_000;
                    expiresAt = new Date(Date.now() + ms).toISOString();
                }
            }

            await blacklistRepo.add({ uuid: profile.id, username: profile.name, reason, added_by: ctx.username, expires_at: expiresAt }).catch(() => {});
            bridge.blacklist.add(profile.id);
            const expiryMsg = expiresAt ? ` (expires in ${durationStr})` : ' (permanent)';
            bridge.bot.chat('oc', `✅ ${profile.name} added to internal blacklist: ${reason}${expiryMsg}`);

            // Log to blacklist channel
            await sendBlacklistLog(bridge, 'added', profile.name, profile.id, ctx.username, reason, expiresAt);
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
            bridge.bot.chat('oc', `✅ ${profile.name} removed from internal blacklist.`);

            // Log to blacklist channel
            await sendBlacklistLog(bridge, 'removed', profile.name, profile.id, ctx.username);
        },
    });
}
