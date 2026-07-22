/** Snapshot fields used by the balanced weight pack (and future presets). */
export interface TournamentStats {
    duels_wins: number;
    tnt_wins: number;
    bb_wins: number;
    party_wins: number;
    sw_wins: number;
    bw_wins: number;
    bw_final_kills: number;
    gexp: number;
    /** Phase 5: login ≥15m from guild-chat presence (persisted cumulative count). */
    qualifying_logins: number;
}

export type TournamentStatKey = keyof TournamentStats;

export type TournamentWeightPack = Record<TournamentStatKey, number>;

/** Default balanced scoring pack (locked product spec). */
export const BALANCED_WEIGHTS: TournamentWeightPack = {
    duels_wins: 1,
    tnt_wins: 3,
    bb_wins: 3,
    party_wins: 3,
    sw_wins: 5,
    bw_wins: 9,
    bw_final_kills: 2.5,
    gexp: 0.02,
    qualifying_logins: 20,
};

export const WEIGHT_PRESETS = {
    balanced: BALANCED_WEIGHTS,
} as const;

export type WeightPresetName = keyof typeof WEIGHT_PRESETS;

export type TournamentStatus = 'draft' | 'active' | 'ended' | 'cancelled';
export type ParticipantStatus = 'active' | 'left' | 'disqualified';

export interface TournamentMetricsConfig {
    preset: WeightPresetName | string;
    weights: TournamentWeightPack;
}

export interface TournamentRecord {
    id: string;
    name: string;
    status: TournamentStatus;
    metrics: TournamentMetricsConfig;
    starts_at: string;
    ends_at: string;
    channel_id: string | null;
    created_by: string;
    created_at: string;
    started_at: string | null;
    ended_at: string | null;
    /** Phase 3: last daily digest post time (spam guard). */
    last_daily_digest_at: string | null;
}

export interface TournamentParticipant {
    id: string;
    tournament_id: string;
    uuid: string;
    username: string;
    baseline_stats: TournamentStats;
    status: ParticipantStatus;
    /** Phase 2: team assignment */
    team_id: string | null;
    /**
     * Phase 5: cumulative qualifying logins (≥15m continuous guild-chat online).
     * Mirrored into snapshot stats so weighted deltas pick up login gains.
     */
    qualifying_logins: number;
    enrolled_at: string;
}

/** Phase 5: open guild-chat online streak (Hypixel join/leave while in guild). */
export interface TournamentOnlinePresence {
    uuid: string;
    username: string;
    joined_at: string;
    /** True once this continuous streak already awarded +1. */
    credited: boolean;
}

export interface TournamentMembershipSegment {
    id: string;
    tournament_id: string;
    uuid: string;
    joined_at: string;
    left_at: string | null;
}

export interface TournamentSnapshot {
    id: string;
    tournament_id: string;
    uuid: string;
    taken_at: string;
    stats: TournamentStats;
}

export interface LeaderboardEntry {
    uuid: string;
    username: string;
    status: ParticipantStatus;
    score: number;
    delta: TournamentStats;
    rank: number;
}

/** Max roster size for Phase 2 teams (hybrid score uses sum / MAX_TEAM_SIZE). */
export const MAX_TEAM_SIZE = 5;

export interface TournamentTeam {
    id: string;
    tournament_id: string;
    name: string;
    captain_uuid: string;
    /** Mojang UUIDs (no hyphens) invited but not yet joined. */
    pending_invites: string[];
    created_at: string;
}

export interface TeamLeaderboardEntry {
    team_id: string;
    name: string;
    captain_uuid: string;
    captain_username: string;
    /** Active members whose scores feed the hybrid (left/DQ excluded). */
    member_count: number;
    /** Hybrid score: 0.7 × avg + 0.3 × (sum / MAX_TEAM_SIZE). */
    score: number;
    members: Array<{ uuid: string; username: string; status: ParticipantStatus; score: number }>;
    rank: number;
}

/** One calendar week of a long tournament (from starts_at, 7-day slices). */
export interface TournamentWeekWindow {
    week_number: number;
    starts_at: string;
    ends_at: string;
}

/** Frozen podium row for a completed tournament week (solo). */
export interface WeekSoloPodiumEntry {
    uuid: string;
    username: string;
    score: number;
    rank: number;
}

/** Frozen podium row for a completed tournament week (team). */
export interface WeekTeamPodiumEntry {
    team_id: string;
    name: string;
    captain_uuid: string;
    captain_username: string;
    member_count: number;
    score: number;
    rank: number;
}

/**
 * Persisted weekly sub-winner results (Phase 3).
 * Frozen on week rollover so re-announce does not recalculate from later snapshots.
 */
export interface TournamentWeekResult {
    id: string;
    tournament_id: string;
    week_number: number;
    week_starts_at: string;
    week_ends_at: string;
    solo_podium: WeekSoloPodiumEntry[];
    team_podium: WeekTeamPodiumEntry[];
    frozen_at: string;
}

export function emptyStats(): TournamentStats {
    return {
        duels_wins: 0,
        tnt_wins: 0,
        bb_wins: 0,
        party_wins: 0,
        sw_wins: 0,
        bw_wins: 0,
        bw_final_kills: 0,
        gexp: 0,
        qualifying_logins: 0,
    };
}

export function normalizeStats(raw: unknown): TournamentStats {
    const base = emptyStats();
    if (!raw || typeof raw !== 'object') return base;
    const o = raw as Record<string, unknown>;
    for (const key of Object.keys(base) as TournamentStatKey[]) {
        const v = o[key];
        base[key] = typeof v === 'number' && Number.isFinite(v) ? v : 0;
    }
    return base;
}
