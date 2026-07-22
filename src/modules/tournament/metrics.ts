import type { HypixelPlayerResponse } from '@/services/hypixel';
import {
    emptyStats,
    normalizeStats,
    type TournamentStatKey,
    type TournamentStats,
    type TournamentWeightPack,
} from '@/modules/tournament/types';

function num(v: unknown): number {
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/**
 * Extract tournament-relevant lifetime counters from a Hypixel player payload.
 * `gexp` is supplied separately (from our cumulative gexp_daily / guild history).
 * `qualifying_logins` is set to 0 here — callers merge the persisted participant
 * count (Phase 5 guild-chat presence) before writing snapshots.
 */
export function extractTournamentStats(
    player: HypixelPlayerResponse,
    gexp = 0
): TournamentStats {
    const duels = (player.stats?.Duels as Record<string, number> | undefined) ?? {};
    const tnt = (player.stats?.TNTGames as Record<string, number> | undefined) ?? {};
    const bb = (player.stats?.BuildBattle as Record<string, number> | undefined) ?? {};
    const arcade = (player.stats?.Arcade as Record<string, number> | undefined) ?? {};
    const sw = (player.stats?.SkyWars as Record<string, number> | undefined) ?? {};
    const bw = (player.stats?.Bedwars as Record<string, number> | undefined) ?? {};

    return {
        duels_wins: num(duels.wins),
        tnt_wins: num(tnt.wins),
        bb_wins: num(bb.wins),
        party_wins: num(arcade.wins_party),
        sw_wins: num(sw.wins),
        bw_wins: num(bw.wins_bedwars),
        bw_final_kills: num(bw.final_kills_bedwars),
        gexp: Math.max(0, Math.floor(gexp)),
        qualifying_logins: 0, // filled from participant.qualifying_logins at snapshot time
    };
}

/** Per-stat delta (never negative — Hypixel counters only go up). */
export function computeDelta(baseline: TournamentStats, current: TournamentStats): TournamentStats {
    const out = emptyStats();
    for (const key of Object.keys(out) as TournamentStatKey[]) {
        out[key] = Math.max(0, current[key] - baseline[key]);
    }
    return out;
}

/** overall = Σ (delta[stat] × weight[stat]) */
export function computeWeightedScore(
    delta: TournamentStats,
    weights: TournamentWeightPack
): number {
    let score = 0;
    for (const key of Object.keys(delta) as TournamentStatKey[]) {
        score += delta[key] * (weights[key] ?? 0);
    }
    return score;
}

/**
 * Phase 2 team score hybrid: `0.7 × average + 0.3 × (sum / 5)`.
 * `memberScores` should be the individual weighted scores of members that count
 * (typically status === 'active' only — left/DQ excluded).
 */
export function computeTeamHybridScore(memberScores: number[], teamSizeCap = 5): number {
    if (memberScores.length === 0) return 0;
    const sum = memberScores.reduce((a, b) => a + b, 0);
    const average = sum / memberScores.length;
    return 0.7 * average + 0.3 * (sum / teamSizeCap);
}

/** Sum deltas across membership segments (leave/rejoin foundation). */
export function sumDeltas(deltas: TournamentStats[]): TournamentStats {
    const out = emptyStats();
    for (const d of deltas) {
        const n = normalizeStats(d);
        for (const key of Object.keys(out) as TournamentStatKey[]) {
            out[key] += n[key];
        }
    }
    return out;
}
