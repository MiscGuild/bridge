import type Bridge from '@/bridge/bridge';
import type { ModuleCommand } from '@/modules/types';
import type { HypixelGuildResponse } from '@/services/hypixel';
import { gexpHistoryRepo, type GexpDailyRecord } from '@/db/repositories/gexp-history.repo';
import { mojangService } from '@/services/mojang';
import { consola } from 'consola';

/**
 * Sync GEXP data from a guild response into the database.
 * Called during periodic guild sync and on-demand via /gexp sync.
 * Returns the number of members synced.
 */
export async function syncGexpFromGuild(
    guild: HypixelGuildResponse,
    _bridge: Bridge
): Promise<number> {
    const batch: GexpDailyRecord[] = [];
    let memberCount = 0;

    for (const member of guild.members) {
        const history = member.expHistory;
        if (!history || Object.keys(history).length === 0) continue;

        // Resolve username from Mojang (session server, UUID→name)
        const profile = await mojangService.getByUuid(member.uuid).catch(() => null);
        const username = profile?.name ?? `Unknown-${member.uuid.slice(0, 8)}`;

        for (const [date, gexp] of Object.entries(history)) {
            batch.push({ date, uuid: member.uuid, username, gexp_earned: gexp });
        }
        memberCount++;

        // Small delay to avoid Mojang rate limits (200 req/min)
        await new Promise((r) => setTimeout(r, 100));
    }

    if (batch.length > 0) {
        await gexpHistoryRepo.upsertBatch(batch);
        consola.info(`GEXP sync: stored ${batch.length} records for ${memberCount} members`);
    }

    return memberCount;
}

/** Format number with commas */
function fmt(n: number): string {
    return n.toLocaleString('en-US');
}

/** Register in-game !gexptop command */
export function registerGexpHistoryModule(commands: ModuleCommand[]): void {
    commands.push({
        commandId: 'gexp-history:top',
        pattern: /^!gexptop(?:\s+(\d+))?/i,
        async handler(ctx, bridge) {
            const days = Math.min(parseInt(ctx.matches[1] ?? '7', 10) || 7, 30);
            const startDate = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
            const endDate = new Date().toISOString().slice(0, 10);

            const entries = await gexpHistoryRepo.getLeaderboard(startDate, endDate, 10);
            if (entries.length === 0) {
                bridge.bot.chat(ctx.replyChannel, 'No GEXP data available yet.');
                return;
            }

            const lines = entries
                .slice(0, 5)
                .map((e, i) => `${i + 1}. ${e.username}: ${fmt(e.total)}`);
            bridge.bot.chat(ctx.replyChannel, `[GEXP Top ${days}d] ${lines.join(' | ')}`);
        },
    });
}
