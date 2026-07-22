import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';
import env from '@/config/env';
import { tournamentsRepo } from '@/db/repositories/tournaments.repo';
import {
    announceDailyDigest,
    announceWeeklySubWinners,
} from '@/modules/tournament/announce';
import { buildLeaderboard, buildTeamLeaderboard } from '@/modules/tournament/scoring';
import {
    buildTopMovers,
    freezePartialWeekOnEnd,
    freezeWeekIfNeeded,
    getCompletedWeekWindows,
    getCurrentWeekWindow,
    getWeekWindows,
} from '@/modules/tournament/weeks';
import type { TournamentRecord } from '@/modules/tournament/types';

function fmtScore(n: number): string {
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function sameUtcDay(a: Date, b: Date): boolean {
    return (
        a.getUTCFullYear() === b.getUTCFullYear() &&
        a.getUTCMonth() === b.getUTCMonth() &&
        a.getUTCDate() === b.getUTCDate()
    );
}

async function announceFrozenWeek(
    bridge: Bridge,
    tournament: TournamentRecord,
    frozen: Awaited<ReturnType<typeof freezeWeekIfNeeded>>
): Promise<void> {
    const soloLines = frozen.solo_podium.map(
        (e) => `**#${e.rank}** ${e.username} — ${fmtScore(e.score)} pts`
    );
    const teamLines = frozen.team_podium.map(
        (e) =>
            `**#${e.rank}** ${e.name} — ${fmtScore(e.score)} pts (${e.member_count} scoring)`
    );

    await announceWeeklySubWinners(bridge, tournament, {
        weekNumber: frozen.week_number,
        weekStartsAt: frozen.week_starts_at,
        weekEndsAt: frozen.week_ends_at,
        soloLines,
        teamLines,
    });
}

/**
 * Post daily digest for one active tournament if due (UTC hour + not already today).
 * `force` skips the hour/day guards (staff `/tournament digest`).
 */
export async function postDailyDigest(
    bridge: Bridge,
    tournament: TournamentRecord,
    opts: { force?: boolean } = {}
): Promise<{ posted: boolean; reason?: string }> {
    if (tournament.status !== 'active') {
        return { posted: false, reason: `Tournament is \`${tournament.status}\`, not active.` };
    }

    const now = new Date();
    if (!opts.force) {
        if (now.getUTCHours() !== env.TOURNAMENT_DAILY_DIGEST_HOUR) {
            return { posted: false, reason: 'Not digest hour yet.' };
        }
        if (
            tournament.last_daily_digest_at &&
            sameUtcDay(new Date(tournament.last_daily_digest_at), now)
        ) {
            return { posted: false, reason: 'Already posted today.' };
        }
    }

    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    const [movers, soloTop, teamTop] = await Promise.all([
        buildTopMovers(tournament, since, nowIso, 5),
        buildLeaderboard(tournament, 10),
        buildTeamLeaderboard(tournament, 5),
    ]);

    const currentWeek = getCurrentWeekWindow(tournament, now);
    const totalWeeks = getWeekWindows(tournament.starts_at, tournament.ends_at).length;

    const moverLines = movers.map(
        (m) =>
            `**#${m.rank}** ${m.username} — +${fmtScore(m.delta)} (now ${fmtScore(m.scoreNow)})`
    );
    const soloLines = soloTop.map(
        (e) => `\`${e.rank}.\` **${e.username}** — **${fmtScore(e.score)}**`
    );
    const teamLines = teamTop.map(
        (e) => `\`${e.rank}.\` **${e.name}** — **${fmtScore(e.score)}**`
    );

    await announceDailyDigest(bridge, tournament, {
        moverLines,
        soloLines,
        teamLines,
        weekLabel: currentWeek
            ? `Week ${currentWeek.week_number} / ${totalWeeks}`
            : undefined,
    });

    await tournamentsRepo.setLastDailyDigestAt(tournament.id, nowIso);
    return { posted: true };
}

/** Run daily digest for all active tournaments (scheduler). */
export async function runDailyDigestJob(bridge: Bridge): Promise<void> {
    const active = await tournamentsRepo.getActive();
    for (const t of active) {
        try {
            const result = await postDailyDigest(bridge, t);
            if (result.posted) {
                consola.info(`[tournament] daily digest posted for ${t.name} (${t.id})`);
            }
        } catch (err) {
            consola.error(`[tournament] daily digest failed for ${t.id}:`, err);
        }
    }
}

/**
 * Freeze + announce any completed weeks that are not yet persisted.
 * Idempotent: frozen rows are never recalculated; announce only on fresh freeze.
 */
export async function processWeeklyRollovers(bridge: Bridge): Promise<void> {
    const active = await tournamentsRepo.getActive();
    const ended = await tournamentsRepo.getLatest(['ended']);
    const candidates = [...active];
    if (ended && !candidates.some((t) => t.id === ended.id)) {
        candidates.push(ended);
    }

    for (const tournament of candidates) {
        const completed = getCompletedWeekWindows(tournament);
        for (const window of completed) {
            try {
                const existing = await tournamentsRepo.getWeekResult(
                    tournament.id,
                    window.week_number
                );
                if (existing) continue;

                const frozen = await freezeWeekIfNeeded(tournament, window);
                await announceFrozenWeek(bridge, tournament, frozen);
                consola.info(
                    `[tournament] week ${frozen.week_number} frozen & announced for ${tournament.name}`
                );
            } catch (err) {
                consola.error(
                    `[tournament] week ${window.week_number} rollover failed for ${tournament.id}:`,
                    err
                );
            }
        }
    }
}

/**
 * Called from `/tournament end`: freeze completed weeks + truncate the open week.
 * Announces only newly frozen weeks.
 */
export async function freezeWeeksOnTournamentEnd(
    bridge: Bridge,
    tournament: TournamentRecord,
    endedAt = new Date().toISOString()
): Promise<void> {
    await processWeeklyRollovers(bridge);

    try {
        const existingCurrent = getCurrentWeekWindow(tournament, new Date(endedAt));
        if (!existingCurrent) return;

        const already = await tournamentsRepo.getWeekResult(
            tournament.id,
            existingCurrent.week_number
        );
        if (already) return;

        const frozen = await freezePartialWeekOnEnd(tournament, endedAt);
        if (!frozen) return;

        await announceFrozenWeek(bridge, tournament, frozen);
        consola.info(
            `[tournament] partial week ${frozen.week_number} frozen on end for ${tournament.name}`
        );
    } catch (err) {
        consola.error(`[tournament] freeze on end failed for ${tournament.id}:`, err);
    }
}
