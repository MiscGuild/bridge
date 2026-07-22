import { tournamentsRepo } from '@/db/repositories/tournaments.repo';
import {
    computeDelta,
    computeTeamHybridScore,
    computeWeightedScore,
    sumDeltas,
} from '@/modules/tournament/metrics';
import {
    MAX_TEAM_SIZE,
    emptyStats,
    normalizeStats,
    type LeaderboardEntry,
    type TeamLeaderboardEntry,
    type TournamentRecord,
    type TournamentSnapshot,
    type TournamentStats,
    type TournamentWeekResult,
    type TournamentWeekWindow,
    type TournamentWeightPack,
    type WeekSoloPodiumEntry,
    type WeekTeamPodiumEntry,
} from '@/modules/tournament/types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Week boundaries from tournament `starts_at`:
 * - Week 1 = starts_at → min(starts_at + 7d, ends_at)
 * - Week N = starts_at + (N-1)×7d → min(starts_at + N×7d, ends_at)
 * Partial final week is OK (ends at `ends_at`).
 *
 * Overall scoring (Phase 1) is unchanged — these windows are only for
 * weekly sub-winners / digests.
 */
export function getWeekWindows(startsAt: string, endsAt: string): TournamentWeekWindow[] {
    const startMs = new Date(startsAt).getTime();
    const endMs = new Date(endsAt).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
        return [];
    }

    const weeks: TournamentWeekWindow[] = [];
    let weekStart = startMs;
    let weekNumber = 1;

    while (weekStart < endMs) {
        const weekEnd = Math.min(weekStart + WEEK_MS, endMs);
        weeks.push({
            week_number: weekNumber,
            starts_at: new Date(weekStart).toISOString(),
            ends_at: new Date(weekEnd).toISOString(),
        });
        weekStart = weekEnd;
        weekNumber++;
    }

    return weeks;
}

/** Week containing `at` (default now), or null if outside [starts_at, ends_at). */
export function getCurrentWeekWindow(
    tournament: TournamentRecord,
    at = new Date()
): TournamentWeekWindow | null {
    const atMs = at.getTime();
    const startMs = new Date(tournament.starts_at).getTime();
    const endMs = new Date(tournament.ends_at).getTime();
    if (atMs < startMs || atMs >= endMs) {
        // If tournament ended, still allow looking at the last week when at === ends_at
        if (atMs === endMs) {
            const weeks = getWeekWindows(tournament.starts_at, tournament.ends_at);
            return weeks[weeks.length - 1] ?? null;
        }
        return null;
    }
    return (
        getWeekWindows(tournament.starts_at, tournament.ends_at).find((w) => {
            const ws = new Date(w.starts_at).getTime();
            const we = new Date(w.ends_at).getTime();
            return atMs >= ws && atMs < we;
        }) ?? null
    );
}

/** Weeks whose end has passed (eligible to freeze), relative to `now`. */
export function getCompletedWeekWindows(
    tournament: TournamentRecord,
    now = new Date()
): TournamentWeekWindow[] {
    const nowMs = now.getTime();
    return getWeekWindows(tournament.starts_at, tournament.ends_at).filter(
        (w) => new Date(w.ends_at).getTime() <= nowMs
    );
}

function findSnapshotAtOrAfter(
    snaps: TournamentSnapshot[],
    iso: string
): TournamentSnapshot | null {
    const target = new Date(iso).getTime();
    let best: TournamentSnapshot | null = null;
    for (const s of snaps) {
        const t = new Date(s.taken_at).getTime();
        if (t >= target) {
            if (!best || t < new Date(best.taken_at).getTime()) best = s;
        }
    }
    if (!best) {
        for (const s of snaps) {
            const t = new Date(s.taken_at).getTime();
            if (t <= target) {
                if (!best || t > new Date(best.taken_at).getTime()) best = s;
            }
        }
    }
    return best;
}

function findSnapshotAtOrBefore(
    snaps: TournamentSnapshot[],
    iso: string
): TournamentSnapshot | null {
    const target = new Date(iso).getTime();
    let best: TournamentSnapshot | null = null;
    for (const s of snaps) {
        const t = new Date(s.taken_at).getTime();
        if (t <= target) {
            if (!best || t > new Date(best.taken_at).getTime()) best = s;
        }
    }
    return best ?? snaps[snaps.length - 1] ?? null;
}

/**
 * Score progress within a time window using membership segments clipped to
 * [windowStart, windowEnd] and nearest snapshots.
 *
 * Assumptions (documented for operators):
 * - Relies on periodic resnapshots (`TOURNAMENT_RESNAPSHOT_INTERVAL_MINUTES`).
 *   Week-boundary accuracy is ± that interval (nearest at-or-after / at-or-before).
 * - If no snapshot exists near a boundary, falls back to the closest available
 *   snapshot (or participant baseline for week-start when nothing earlier exists).
 * - Leave/rejoin still applies: only in-guild segment overlap inside the window counts.
 * - Overall leaderboard scoring is separate (full-window) and not affected here.
 */
export async function scoreParticipantInWindow(
    tournament: TournamentRecord,
    uuid: string,
    username: string,
    status: LeaderboardEntry['status'],
    baseline: TournamentStats,
    windowStart: string,
    windowEnd: string
): Promise<Omit<LeaderboardEntry, 'rank'>> {
    const weights = tournament.metrics.weights as TournamentWeightPack;
    const segments = await tournamentsRepo.listSegments(tournament.id, uuid);
    const snaps = await tournamentsRepo.listSnapshots(tournament.id, uuid);

    const winStartMs = new Date(windowStart).getTime();
    const winEndMs = new Date(windowEnd).getTime();

    let delta: TournamentStats;

    if (segments.length === 0) {
        // No segments: approximate with nearest snaps at window bounds
        const startSnap =
            findSnapshotAtOrAfter(snaps, windowStart) ??
            findSnapshotAtOrBefore(snaps, windowStart);
        const endSnap = findSnapshotAtOrBefore(snaps, windowEnd);
        if (startSnap && endSnap) {
            delta = computeDelta(startSnap.stats, endSnap.stats);
        } else if (endSnap) {
            delta = computeDelta(normalizeStats(baseline), endSnap.stats);
        } else {
            delta = emptyStats();
        }
    } else {
        const segmentDeltas: TournamentStats[] = [];
        for (const seg of segments) {
            const segJoin = new Date(seg.joined_at).getTime();
            const segLeave = seg.left_at ? new Date(seg.left_at).getTime() : Infinity;
            // Overlap of membership with the week window
            const clipStart = Math.max(segJoin, winStartMs);
            const clipEnd = Math.min(segLeave, winEndMs);
            if (clipStart >= clipEnd) continue;

            const clipStartIso = new Date(clipStart).toISOString();
            const clipEndIso = new Date(clipEnd).toISOString();

            const startSnap =
                findSnapshotAtOrAfter(snaps, clipStartIso) ??
                ({ stats: baseline } as TournamentSnapshot);
            const endSnap = findSnapshotAtOrBefore(snaps, clipEndIso);
            if (!endSnap) continue;
            segmentDeltas.push(computeDelta(startSnap.stats, endSnap.stats));
        }
        delta = segmentDeltas.length > 0 ? sumDeltas(segmentDeltas) : emptyStats();
    }

    const score = status === 'disqualified' ? 0 : computeWeightedScore(delta, weights);
    return { uuid, username, status, score, delta };
}

/** Solo leaderboard for a specific week window (live or historical calc). */
export async function buildWeeklySoloLeaderboard(
    tournament: TournamentRecord,
    window: TournamentWeekWindow,
    limit = 25
): Promise<LeaderboardEntry[]> {
    const participants = await tournamentsRepo.listParticipants(tournament.id);
    const scored: Omit<LeaderboardEntry, 'rank'>[] = [];

    for (const p of participants) {
        scored.push(
            await scoreParticipantInWindow(
                tournament,
                p.uuid,
                p.username,
                p.status,
                p.baseline_stats,
                window.starts_at,
                window.ends_at
            )
        );
    }

    scored.sort((a, b) => {
        if (a.status === 'disqualified' && b.status !== 'disqualified') return 1;
        if (b.status === 'disqualified' && a.status !== 'disqualified') return -1;
        return b.score - a.score;
    });

    return scored.slice(0, limit).map((e, i) => ({ ...e, rank: i + 1 }));
}

/** Team leaderboard for a week window using hybrid over weekly solo scores. */
export async function buildWeeklyTeamLeaderboard(
    tournament: TournamentRecord,
    window: TournamentWeekWindow,
    limit = 25
): Promise<TeamLeaderboardEntry[]> {
    const teams = await tournamentsRepo.listTeams(tournament.id);
    if (teams.length === 0) return [];

    const solo = await buildWeeklySoloLeaderboard(tournament, window, Number.MAX_SAFE_INTEGER);
    const byUuid = new Map(solo.map((e) => [e.uuid, e]));
    const entries: Omit<TeamLeaderboardEntry, 'rank'>[] = [];

    for (const team of teams) {
        const members = await tournamentsRepo.listTeamMembers(tournament.id, team.id);
        if (members.length === 0) continue;

        const memberRows = members.map((m) => {
            const scored = byUuid.get(m.uuid);
            return {
                uuid: m.uuid,
                username: m.username,
                status: m.status,
                score: scored?.score ?? 0,
            };
        });

        const contributing = memberRows
            .filter((m) => m.status === 'active')
            .map((m) => m.score);

        const captain = memberRows.find((m) => m.uuid === team.captain_uuid);

        entries.push({
            team_id: team.id,
            name: team.name,
            captain_uuid: team.captain_uuid,
            captain_username: captain?.username ?? team.captain_uuid.slice(0, 8),
            member_count: contributing.length,
            score: computeTeamHybridScore(contributing, MAX_TEAM_SIZE),
            members: memberRows,
        });
    }

    entries.sort((a, b) => b.score - a.score);
    return entries.slice(0, limit).map((e, i) => ({ ...e, rank: i + 1 }));
}

/**
 * Score as of a point in time (snapshots/segments truncated at `asOf`).
 * Used for daily "top movers" ≈ score(now) − score(asOf − 24h).
 */
export async function scoreParticipantAsOf(
    tournament: TournamentRecord,
    uuid: string,
    username: string,
    status: LeaderboardEntry['status'],
    baseline: TournamentStats,
    asOf: string
): Promise<Omit<LeaderboardEntry, 'rank'>> {
    return scoreParticipantInWindow(
        tournament,
        uuid,
        username,
        status,
        baseline,
        tournament.starts_at,
        asOf
    );
}

export async function buildLeaderboardAsOf(
    tournament: TournamentRecord,
    asOf: string,
    limit = 25
): Promise<LeaderboardEntry[]> {
    const participants = await tournamentsRepo.listParticipants(tournament.id);
    const scored: Omit<LeaderboardEntry, 'rank'>[] = [];

    for (const p of participants) {
        scored.push(
            await scoreParticipantAsOf(
                tournament,
                p.uuid,
                p.username,
                p.status,
                p.baseline_stats,
                asOf
            )
        );
    }

    scored.sort((a, b) => {
        if (a.status === 'disqualified' && b.status !== 'disqualified') return 1;
        if (b.status === 'disqualified' && a.status !== 'disqualified') return -1;
        return b.score - a.score;
    });

    return scored.slice(0, limit).map((e, i) => ({ ...e, rank: i + 1 }));
}

export interface TopMover {
    uuid: string;
    username: string;
    scoreNow: number;
    scoreBefore: number;
    delta: number;
    rank: number;
}

/** Biggest overall score gains since `sinceIso` (default ~24h ago). */
export async function buildTopMovers(
    tournament: TournamentRecord,
    sinceIso: string,
    nowIso = new Date().toISOString(),
    limit = 5
): Promise<TopMover[]> {
    const participants = await tournamentsRepo.listParticipants(tournament.id);
    const movers: Omit<TopMover, 'rank'>[] = [];

    for (const p of participants) {
        if (p.status === 'disqualified') continue;
        const before = await scoreParticipantAsOf(
            tournament,
            p.uuid,
            p.username,
            p.status,
            p.baseline_stats,
            sinceIso
        );
        const now = await scoreParticipantAsOf(
            tournament,
            p.uuid,
            p.username,
            p.status,
            p.baseline_stats,
            nowIso
        );
        movers.push({
            uuid: p.uuid,
            username: p.username,
            scoreNow: now.score,
            scoreBefore: before.score,
            delta: now.score - before.score,
        });
    }

    movers.sort((a, b) => b.delta - a.delta);
    return movers
        .filter((m) => m.delta > 0)
        .slice(0, limit)
        .map((e, i) => ({ ...e, rank: i + 1 }));
}

function toSoloPodium(board: LeaderboardEntry[], top = 3): WeekSoloPodiumEntry[] {
    return board.slice(0, top).map((e) => ({
        uuid: e.uuid,
        username: e.username,
        score: e.score,
        rank: e.rank,
    }));
}

function toTeamPodium(board: TeamLeaderboardEntry[], top = 3): WeekTeamPodiumEntry[] {
    return board.slice(0, top).map((e) => ({
        team_id: e.team_id,
        name: e.name,
        captain_uuid: e.captain_uuid,
        captain_username: e.captain_username,
        member_count: e.member_count,
        score: e.score,
        rank: e.rank,
    }));
}

/**
 * Freeze a completed week from available snapshots (idempotent).
 * Returns existing frozen row if already persisted.
 */
export async function freezeWeekIfNeeded(
    tournament: TournamentRecord,
    window: TournamentWeekWindow
): Promise<TournamentWeekResult> {
    const existing = await tournamentsRepo.getWeekResult(tournament.id, window.week_number);
    if (existing) return existing;

    const soloBoard = await buildWeeklySoloLeaderboard(tournament, window, 3);
    const teamBoard = await buildWeeklyTeamLeaderboard(tournament, window, 3);

    return tournamentsRepo.freezeWeekResult({
        tournament_id: tournament.id,
        week_number: window.week_number,
        week_starts_at: window.starts_at,
        week_ends_at: window.ends_at,
        solo_podium: toSoloPodium(soloBoard, 3),
        team_podium: toTeamPodium(teamBoard, 3),
    });
}

/**
 * On early `/tournament end`, freeze the in-progress week truncated to `endedAt`
 * so the final partial week still gets sub-winners.
 */
export async function freezePartialWeekOnEnd(
    tournament: TournamentRecord,
    endedAt = new Date().toISOString()
): Promise<TournamentWeekResult | null> {
    const current = getCurrentWeekWindow(tournament, new Date(endedAt));
    if (!current) {
        // At or past ends_at — completed-week path handles it
        return null;
    }
    const truncated: TournamentWeekWindow = {
        ...current,
        ends_at: endedAt,
    };
    return freezeWeekIfNeeded(tournament, truncated);
}
