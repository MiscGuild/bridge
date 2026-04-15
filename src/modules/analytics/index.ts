import type Bridge from '@/bridge/bridge';
import type { ModuleCommand } from '@/modules/types';
import type { ParsedChatEvent } from '@/bot/chat-parser';
import { analyticsRepo } from '@/db/repositories/analytics.repo';
import { guildRankService } from '@/services/guild-ranks';

/** In-memory daily stats (resets at midnight UTC) */
interface DailyStats {
    date: string;
    messages: number;
    commands: number;
    joins: number;
    leaves: number;
    kicks: number;
    promotions: number;
    demotions: number;
    levelUps: number;
    quests: number;
    activeUsers: Set<string>;
    topChatters: Record<string, number>;
}

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

function fresh(): DailyStats {
    return {
        date: todayKey(),
        messages: 0,
        commands: 0,
        joins: 0,
        leaves: 0,
        kicks: 0,
        promotions: 0,
        demotions: 0,
        levelUps: 0,
        quests: 0,
        activeUsers: new Set(),
        topChatters: {},
    };
}

let stats = fresh();

function ensureToday(): void {
    if (stats.date !== todayKey()) {
        flushToSupabase().catch(() => {});
        stats = fresh();
    }
}

async function flushToSupabase(): Promise<void> {
    try {
        // Use repo's increment approach for each counter delta since last flush
        // We store the last flushed values to compute deltas
        const db = await analyticsRepo.getToday();
        const base = db ?? {
            total_messages: 0,
            joins: 0,
            leaves: 0,
            kicks: 0,
            promotions: 0,
            demotions: 0,
            quest_completions: 0,
        };

        const deltas: Array<[string, number]> = [
            ['total_messages', stats.messages - Number(base.total_messages ?? 0)],
            ['joins', stats.joins - Number(base.joins ?? 0)],
            ['leaves', stats.leaves - Number(base.leaves ?? 0)],
            ['kicks', stats.kicks - Number(base.kicks ?? 0)],
            ['promotions', stats.promotions - Number(base.promotions ?? 0)],
            ['demotions', stats.demotions - Number(base.demotions ?? 0)],
            ['quest_completions', stats.quests - Number(base.quest_completions ?? 0)],
        ];

        for (const [field, delta] of deltas) {
            if (delta > 0) {
                await analyticsRepo.increment(field as any, delta).catch(() => {});
            }
        }
    } catch {
        // Supabase optional
    }
}

function buildReport(period: 'today' | 'week'): string {
    const s = stats;
    return `[Analytics ${period === 'today' ? 'Today' : '7d'}] Msgs: ${s.messages} | Cmds: ${s.commands} | Joins: ${s.joins} | Leaves: ${s.leaves} | Kicks: ${s.kicks} | Promos: ${s.promotions} | Demotion: ${s.demotions} | Active: ${s.activeUsers.size}`;
}

export function trackEvent(event: ParsedChatEvent): void {
    ensureToday();
    switch (event.type) {
        case 'guildChat':
            stats.messages++;
            if (event.message.startsWith('!')) stats.commands++;
            stats.activeUsers.add(event.playerName.toLowerCase());
            stats.topChatters[event.playerName] = (stats.topChatters[event.playerName] ?? 0) + 1;
            break;
        case 'memberJoinLeave':
            if (event.status === 'joined') stats.joins++;
            else stats.leaves++;
            break;
        case 'memberKick':
            stats.kicks++;
            break;
        case 'promoteDemote':
            if (event.action === 'promoted') stats.promotions++;
            else stats.demotions++;
            break;
        case 'guildLevelUp':
            stats.levelUps++;
            break;
        case 'questComplete':
        case 'questTierComplete':
            stats.quests++;
            break;
    }
}

export function registerAnalyticsModule(commands: ModuleCommand[]): void {
    // Schedule daily report at midnight UTC
    const scheduleReport = (bridge: Bridge) => {
        const now = new Date();
        const next = new Date(now);
        next.setUTCHours(24, 0, 0, 0);
        const delay = next.getTime() - now.getTime();

        setTimeout(async () => {
            await flushToSupabase();
            const report = buildReport('today');
            bridge.bot.chat('oc', `Daily Report: ${report}`);
            scheduleReport(bridge); // Schedule next
        }, delay);
    };

    // !analytics [today|weekly] command (staff only)
    commands.push({
        commandId: 'analytics',
        pattern: /^!analytics(?:\s+(today|weekly|week))?/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!guildRankService.isStaffRank(ctx.guildRank)) {
                bridge.bot.chat(ctx.replyChannel, `${ctx.username}, this command is staff-only.`);
                return;
            }
            const period =
                ctx.matches[1]?.toLowerCase() === 'weekly' ||
                ctx.matches[1]?.toLowerCase() === 'week'
                    ? 'week'
                    : 'today';
            bridge.bot.chat('oc', buildReport(period));
        },
    });

    // !statsreport - manually trigger the daily report (staff only)
    commands.push({
        commandId: 'statsreport',
        pattern: /^!statsreport/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            if (!guildRankService.isStaffRank(ctx.guildRank)) {
                bridge.bot.chat(ctx.replyChannel, `${ctx.username}, this command is staff-only.`);
                return;
            }
            await flushToSupabase();
            bridge.bot.chat('oc', buildReport('today'));
        },
    });

    // Wire the daily report scheduler — called once from bridge.start()
    (commands as any).__initAnalytics = (bridge: Bridge) => {
        scheduleReport(bridge);
        // Flush every hour
        setInterval(() => flushToSupabase().catch(() => {}), 60 * 60 * 1000);
    };
}
