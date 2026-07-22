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
    type TournamentWeightPack,
} from '@/modules/tournament/types';

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
    // If nothing at/after, use the last snapshot before (closest)
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
 * Score a participant using membership segments:
 * for each in-guild segment, delta = endSnap − startSnap; sum deltas; apply weights.
 * Falls back to baseline → latest if no segments exist.
 */
export async function scoreParticipant(
    tournament: TournamentRecord,
    uuid: string,
    username: string,
    status: LeaderboardEntry['status'],
    baseline: TournamentStats
): Promise<Omit<LeaderboardEntry, 'rank'>> {
    const weights = tournament.metrics.weights as TournamentWeightPack;
    const segments = await tournamentsRepo.listSegments(tournament.id, uuid);
    const snaps = await tournamentsRepo.listSnapshots(tournament.id, uuid);

    let delta: TournamentStats;

    if (segments.length === 0) {
        const latest = snaps[snaps.length - 1];
        delta = latest
            ? computeDelta(normalizeStats(baseline), latest.stats)
            : emptyStats();
    } else {
        const segmentDeltas: TournamentStats[] = [];
        for (const seg of segments) {
            const startSnap =
                findSnapshotAtOrAfter(snaps, seg.joined_at) ??
                ({ stats: baseline } as TournamentSnapshot);
            const endSnap = seg.left_at
                ? findSnapshotAtOrBefore(snaps, seg.left_at)
                : snaps[snaps.length - 1] ?? null;
            if (!endSnap) continue;
            segmentDeltas.push(computeDelta(startSnap.stats, endSnap.stats));
        }
        delta = segmentDeltas.length > 0 ? sumDeltas(segmentDeltas) : emptyStats();
    }

    // Disqualified players stay on the board with 0 for transparency (Phase 4 Coral DQ)
    const score =
        status === 'disqualified' ? 0 : computeWeightedScore(delta, weights);

    return { uuid, username, status, score, delta };
}

export async function buildLeaderboard(
    tournament: TournamentRecord,
    limit = 25
): Promise<LeaderboardEntry[]> {
    const participants = await tournamentsRepo.listParticipants(tournament.id);
    const scored: Omit<LeaderboardEntry, 'rank'>[] = [];

    for (const p of participants) {
        if (p.status === 'disqualified') {
            // Include DQ at bottom later via sort; still score for display
        }
        scored.push(
            await scoreParticipant(
                tournament,
                p.uuid,
                p.username,
                p.status,
                p.baseline_stats
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

export async function scorePlayerStanding(
    tournament: TournamentRecord,
    uuid: string
): Promise<{ entry: LeaderboardEntry; totalParticipants: number } | null> {
    const full = await buildLeaderboard(tournament, Number.MAX_SAFE_INTEGER);
    const entry = full.find((e) => e.uuid === uuid.replace(/-/g, '').toLowerCase());
    if (!entry) return null;
    return { entry, totalParticipants: full.length };
}

/**
 * Team leaderboard using hybrid score over active members only.
 * Left / DQ members remain on the roster for display but do not contribute
 * to `memberScores` (excluded — not counted as 0).
 * Teams with ≥1 rostered member appear; score may be 0 if none are active.
 */
export async function buildTeamLeaderboard(
    tournament: TournamentRecord,
    limit = 25
): Promise<TeamLeaderboardEntry[]> {
    const teams = await tournamentsRepo.listTeams(tournament.id);
    if (teams.length === 0) return [];

    // Score all participants once, then aggregate per team
    const solo = await buildLeaderboard(tournament, Number.MAX_SAFE_INTEGER);
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

        // Only active members feed the hybrid average / sum
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
