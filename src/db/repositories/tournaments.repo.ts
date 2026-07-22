import { getSupabaseClient } from '@/db/client';
import { readJson, writeJson } from '@/db/json-store';
import {
    normalizeStats,
    type ParticipantStatus,
    type TournamentMembershipSegment,
    type TournamentMetricsConfig,
    type TournamentOnlinePresence,
    type TournamentParticipant,
    type TournamentRecord,
    type TournamentSnapshot,
    type TournamentStats,
    type TournamentStatus,
    type TournamentTeam,
    type TournamentWeekResult,
    type WeekSoloPodiumEntry,
    type WeekTeamPodiumEntry,
} from '@/modules/tournament/types';

// ── JSON fallback store ────────────────────────────────────────────────────────

const FILE = 'tournaments.json';

interface TournamentStore {
    tournaments: TournamentRecord[];
    participants: TournamentParticipant[];
    segments: TournamentMembershipSegment[];
    snapshots: TournamentSnapshot[];
    teams: TournamentTeam[];
    week_results: TournamentWeekResult[];
    /** Phase 5: open guild-chat online streaks */
    presence: TournamentOnlinePresence[];
}

async function jsonRead(): Promise<TournamentStore> {
    const store = await readJson<TournamentStore>(FILE, {
        tournaments: [],
        participants: [],
        segments: [],
        snapshots: [],
        teams: [],
        week_results: [],
        presence: [],
    });
    if (!store.teams) store.teams = [];
    if (!store.week_results) store.week_results = [];
    if (!store.presence) store.presence = [];
    for (const t of store.tournaments) {
        if (t.last_daily_digest_at === undefined) t.last_daily_digest_at = null;
    }
    for (const p of store.participants) {
        if (typeof p.qualifying_logins !== 'number') p.qualifying_logins = 0;
    }
    return store;
}

async function jsonWrite(store: TournamentStore): Promise<void> {
    return writeJson(FILE, store);
}

function newId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeUuid(uuid: string): string {
    return uuid.replace(/-/g, '').toLowerCase();
}

function mapTournament(row: Record<string, unknown>): TournamentRecord {
    const metrics = (row.metrics ?? {}) as TournamentMetricsConfig;
    return {
        id: String(row.id),
        name: String(row.name),
        status: row.status as TournamentStatus,
        metrics,
        starts_at: String(row.starts_at),
        ends_at: String(row.ends_at),
        channel_id: (row.channel_id as string | null) ?? null,
        created_by: String(row.created_by),
        created_at: String(row.created_at),
        started_at: (row.started_at as string | null) ?? null,
        ended_at: (row.ended_at as string | null) ?? null,
        last_daily_digest_at: (row.last_daily_digest_at as string | null) ?? null,
    };
}

function mapWeekResult(row: Record<string, unknown>): TournamentWeekResult {
    return {
        id: String(row.id),
        tournament_id: String(row.tournament_id),
        week_number: Number(row.week_number),
        week_starts_at: String(row.week_starts_at),
        week_ends_at: String(row.week_ends_at),
        solo_podium: Array.isArray(row.solo_podium)
            ? (row.solo_podium as WeekSoloPodiumEntry[])
            : [],
        team_podium: Array.isArray(row.team_podium)
            ? (row.team_podium as WeekTeamPodiumEntry[])
            : [],
        frozen_at: String(row.frozen_at),
    };
}

function mapParticipant(row: Record<string, unknown>): TournamentParticipant {
    return {
        id: String(row.id),
        tournament_id: String(row.tournament_id),
        uuid: normalizeUuid(String(row.uuid)),
        username: String(row.username),
        baseline_stats: normalizeStats(row.baseline_stats),
        status: row.status as ParticipantStatus,
        team_id: (row.team_id as string | null) ?? null,
        qualifying_logins:
            typeof row.qualifying_logins === 'number' && Number.isFinite(row.qualifying_logins)
                ? Math.max(0, Math.floor(row.qualifying_logins))
                : 0,
        enrolled_at: String(row.enrolled_at),
    };
}

function mapPresence(row: Record<string, unknown>): TournamentOnlinePresence {
    return {
        uuid: normalizeUuid(String(row.uuid)),
        username: String(row.username),
        joined_at: String(row.joined_at),
        credited: Boolean(row.credited),
    };
}

function mapSegment(row: Record<string, unknown>): TournamentMembershipSegment {
    return {
        id: String(row.id),
        tournament_id: String(row.tournament_id),
        uuid: normalizeUuid(String(row.uuid)),
        joined_at: String(row.joined_at),
        left_at: (row.left_at as string | null) ?? null,
    };
}

function mapSnapshot(row: Record<string, unknown>): TournamentSnapshot {
    return {
        id: String(row.id),
        tournament_id: String(row.tournament_id),
        uuid: normalizeUuid(String(row.uuid)),
        taken_at: String(row.taken_at),
        stats: normalizeStats(row.stats),
    };
}

function mapTeam(row: Record<string, unknown>): TournamentTeam {
    const invites = row.pending_invites;
    const pending = Array.isArray(invites)
        ? invites.map((u) => normalizeUuid(String(u)))
        : [];
    return {
        id: String(row.id),
        tournament_id: String(row.tournament_id),
        name: String(row.name),
        captain_uuid: normalizeUuid(String(row.captain_uuid)),
        pending_invites: pending,
        created_at: String(row.created_at),
    };
}

export interface CreateTournamentInput {
    name: string;
    metrics: TournamentMetricsConfig;
    starts_at: string;
    ends_at: string;
    channel_id?: string | null;
    created_by: string;
}

export interface UpsertParticipantInput {
    tournament_id: string;
    uuid: string;
    username: string;
    baseline_stats: TournamentStats;
    status?: ParticipantStatus;
}

// ── Repo ──────────────────────────────────────────────────────────────────────

export const tournamentsRepo = {
    async create(input: CreateTournamentInput): Promise<TournamentRecord> {
        const db = getSupabaseClient();
        if (db) {
            const { data, error } = await db
                .from('tournaments')
                .insert({
                    name: input.name,
                    status: 'draft',
                    metrics: input.metrics,
                    starts_at: input.starts_at,
                    ends_at: input.ends_at,
                    channel_id: input.channel_id ?? null,
                    created_by: input.created_by,
                })
                .select()
                .single();
            if (error || !data) throw new Error(error?.message ?? 'Failed to create tournament');
            return mapTournament(data as Record<string, unknown>);
        }

        const record: TournamentRecord = {
            id: newId(),
            name: input.name,
            status: 'draft',
            metrics: input.metrics,
            starts_at: input.starts_at,
            ends_at: input.ends_at,
            channel_id: input.channel_id ?? null,
            created_by: input.created_by,
            created_at: new Date().toISOString(),
            started_at: null,
            ended_at: null,
            last_daily_digest_at: null,
        };
        const store = await jsonRead();
        store.tournaments.push(record);
        await jsonWrite(store);
        return record;
    },

    async getById(id: string): Promise<TournamentRecord | null> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('tournaments').select('*').eq('id', id).maybeSingle();
            return data ? mapTournament(data as Record<string, unknown>) : null;
        }
        return (await jsonRead()).tournaments.find((t) => t.id === id) ?? null;
    },

    async getActive(): Promise<TournamentRecord[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('tournaments')
                .select('*')
                .eq('status', 'active')
                .order('started_at', { ascending: false });
            return ((data as Record<string, unknown>[]) ?? []).map(mapTournament);
        }
        return (await jsonRead()).tournaments
            .filter((t) => t.status === 'active')
            .sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''));
    },

    /** Most recent tournament in the given statuses (draft → for start, active → for info). */
    async getLatest(statuses: TournamentStatus[]): Promise<TournamentRecord | null> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('tournaments')
                .select('*')
                .in('status', statuses)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            return data ? mapTournament(data as Record<string, unknown>) : null;
        }
        const list = (await jsonRead()).tournaments
            .filter((t) => statuses.includes(t.status))
            .sort((a, b) => b.created_at.localeCompare(a.created_at));
        return list[0] ?? null;
    },

    async updateStatus(
        id: string,
        status: TournamentStatus,
        extras: Partial<Pick<TournamentRecord, 'started_at' | 'ended_at'>> = {}
    ): Promise<TournamentRecord | null> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('tournaments')
                .update({ status, ...extras })
                .eq('id', id)
                .select()
                .single();
            return data ? mapTournament(data as Record<string, unknown>) : null;
        }
        const store = await jsonRead();
        const t = store.tournaments.find((x) => x.id === id);
        if (!t) return null;
        t.status = status;
        if (extras.started_at !== undefined) t.started_at = extras.started_at;
        if (extras.ended_at !== undefined) t.ended_at = extras.ended_at;
        await jsonWrite(store);
        return t;
    },

    async upsertParticipant(input: UpsertParticipantInput): Promise<TournamentParticipant> {
        const uuid = normalizeUuid(input.uuid);
        const db = getSupabaseClient();
        if (db) {
            const { data, error } = await db
                .from('tournament_participants')
                .upsert(
                    {
                        tournament_id: input.tournament_id,
                        uuid,
                        username: input.username,
                        baseline_stats: input.baseline_stats,
                        status: input.status ?? 'active',
                    },
                    { onConflict: 'tournament_id,uuid' }
                )
                .select()
                .single();
            if (error || !data) throw new Error(error?.message ?? 'Failed to upsert participant');
            return mapParticipant(data as Record<string, unknown>);
        }

        const store = await jsonRead();
        const existing = store.participants.find(
            (p) => p.tournament_id === input.tournament_id && p.uuid === uuid
        );
        if (existing) {
            existing.username = input.username;
            existing.baseline_stats = input.baseline_stats;
            existing.status = input.status ?? 'active';
            await jsonWrite(store);
            return existing;
        }
        const record: TournamentParticipant = {
            id: newId(),
            tournament_id: input.tournament_id,
            uuid,
            username: input.username,
            baseline_stats: input.baseline_stats,
            status: input.status ?? 'active',
            team_id: null,
            qualifying_logins: 0,
            enrolled_at: new Date().toISOString(),
        };
        store.participants.push(record);
        await jsonWrite(store);
        return record;
    },

    /**
     * Increment Phase 5 qualifying_logins; returns the new total.
     */
    async incrementQualifyingLogins(tournamentId: string, uuid: string): Promise<number> {
        const norm = normalizeUuid(uuid);
        const db = getSupabaseClient();
        if (db) {
            const existing = await tournamentsRepo.getParticipant(tournamentId, norm);
            const next = (existing?.qualifying_logins ?? 0) + 1;
            await db
                .from('tournament_participants')
                .update({ qualifying_logins: next })
                .eq('tournament_id', tournamentId)
                .eq('uuid', norm);
            return next;
        }
        const store = await jsonRead();
        const p = store.participants.find(
            (x) => x.tournament_id === tournamentId && x.uuid === norm
        );
        if (!p) return 0;
        p.qualifying_logins = (p.qualifying_logins ?? 0) + 1;
        await jsonWrite(store);
        return p.qualifying_logins;
    },

    async updateParticipantStatus(
        tournamentId: string,
        uuid: string,
        status: ParticipantStatus
    ): Promise<void> {
        const norm = normalizeUuid(uuid);
        const db = getSupabaseClient();
        if (db) {
            await db
                .from('tournament_participants')
                .update({ status })
                .eq('tournament_id', tournamentId)
                .eq('uuid', norm);
            return;
        }
        const store = await jsonRead();
        const p = store.participants.find(
            (x) => x.tournament_id === tournamentId && x.uuid === norm
        );
        if (p) {
            p.status = status;
            await jsonWrite(store);
        }
    },

    async listParticipants(tournamentId: string): Promise<TournamentParticipant[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('tournament_participants')
                .select('*')
                .eq('tournament_id', tournamentId);
            return ((data as Record<string, unknown>[]) ?? []).map(mapParticipant);
        }
        return (await jsonRead()).participants.filter((p) => p.tournament_id === tournamentId);
    },

    async getParticipant(
        tournamentId: string,
        uuid: string
    ): Promise<TournamentParticipant | null> {
        const norm = normalizeUuid(uuid);
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('tournament_participants')
                .select('*')
                .eq('tournament_id', tournamentId)
                .eq('uuid', norm)
                .maybeSingle();
            return data ? mapParticipant(data as Record<string, unknown>) : null;
        }
        return (
            (await jsonRead()).participants.find(
                (p) => p.tournament_id === tournamentId && p.uuid === norm
            ) ?? null
        );
    },

    async openSegment(tournamentId: string, uuid: string): Promise<TournamentMembershipSegment> {
        const norm = normalizeUuid(uuid);
        const now = new Date().toISOString();
        const db = getSupabaseClient();
        if (db) {
            const { data, error } = await db
                .from('tournament_membership_segments')
                .insert({
                    tournament_id: tournamentId,
                    uuid: norm,
                    joined_at: now,
                    left_at: null,
                })
                .select()
                .single();
            if (error || !data) throw new Error(error?.message ?? 'Failed to open segment');
            return mapSegment(data as Record<string, unknown>);
        }
        const store = await jsonRead();
        const record: TournamentMembershipSegment = {
            id: newId(),
            tournament_id: tournamentId,
            uuid: norm,
            joined_at: now,
            left_at: null,
        };
        store.segments.push(record);
        await jsonWrite(store);
        return record;
    },

    async closeOpenSegment(
        tournamentId: string,
        uuid: string,
        leftAt = new Date().toISOString()
    ): Promise<TournamentMembershipSegment | null> {
        const norm = normalizeUuid(uuid);
        const db = getSupabaseClient();
        if (db) {
            const { data: open } = await db
                .from('tournament_membership_segments')
                .select('*')
                .eq('tournament_id', tournamentId)
                .eq('uuid', norm)
                .is('left_at', null)
                .order('joined_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (!open) return null;
            const { data } = await db
                .from('tournament_membership_segments')
                .update({ left_at: leftAt })
                .eq('id', (open as { id: string }).id)
                .select()
                .single();
            return data ? mapSegment(data as Record<string, unknown>) : null;
        }
        const store = await jsonRead();
        const open = store.segments
            .filter((s) => s.tournament_id === tournamentId && s.uuid === norm && !s.left_at)
            .sort((a, b) => b.joined_at.localeCompare(a.joined_at))[0];
        if (!open) return null;
        open.left_at = leftAt;
        await jsonWrite(store);
        return open;
    },

    async listSegments(
        tournamentId: string,
        uuid?: string
    ): Promise<TournamentMembershipSegment[]> {
        const db = getSupabaseClient();
        if (db) {
            let q = db
                .from('tournament_membership_segments')
                .select('*')
                .eq('tournament_id', tournamentId)
                .order('joined_at', { ascending: true });
            if (uuid) q = q.eq('uuid', normalizeUuid(uuid));
            const { data } = await q;
            return ((data as Record<string, unknown>[]) ?? []).map(mapSegment);
        }
        let segs = (await jsonRead()).segments.filter((s) => s.tournament_id === tournamentId);
        if (uuid) segs = segs.filter((s) => s.uuid === normalizeUuid(uuid));
        return segs.sort((a, b) => a.joined_at.localeCompare(b.joined_at));
    },

    async addSnapshot(
        tournamentId: string,
        uuid: string,
        stats: TournamentStats,
        takenAt = new Date().toISOString()
    ): Promise<TournamentSnapshot> {
        const norm = normalizeUuid(uuid);
        const db = getSupabaseClient();
        if (db) {
            const { data, error } = await db
                .from('tournament_snapshots')
                .insert({
                    tournament_id: tournamentId,
                    uuid: norm,
                    taken_at: takenAt,
                    stats,
                })
                .select()
                .single();
            if (error || !data) throw new Error(error?.message ?? 'Failed to add snapshot');
            return mapSnapshot(data as Record<string, unknown>);
        }
        const store = await jsonRead();
        const record: TournamentSnapshot = {
            id: newId(),
            tournament_id: tournamentId,
            uuid: norm,
            taken_at: takenAt,
            stats,
        };
        store.snapshots.push(record);
        await jsonWrite(store);
        return record;
    },

    async listSnapshots(tournamentId: string, uuid?: string): Promise<TournamentSnapshot[]> {
        const db = getSupabaseClient();
        if (db) {
            let q = db
                .from('tournament_snapshots')
                .select('*')
                .eq('tournament_id', tournamentId)
                .order('taken_at', { ascending: true });
            if (uuid) q = q.eq('uuid', normalizeUuid(uuid));
            const { data } = await q;
            return ((data as Record<string, unknown>[]) ?? []).map(mapSnapshot);
        }
        let snaps = (await jsonRead()).snapshots.filter((s) => s.tournament_id === tournamentId);
        if (uuid) snaps = snaps.filter((s) => s.uuid === normalizeUuid(uuid));
        return snaps.sort((a, b) => a.taken_at.localeCompare(b.taken_at));
    },

    async getLatestSnapshot(
        tournamentId: string,
        uuid: string
    ): Promise<TournamentSnapshot | null> {
        const snaps = await tournamentsRepo.listSnapshots(tournamentId, uuid);
        return snaps[snaps.length - 1] ?? null;
    },

    // ── Teams (Phase 2) ────────────────────────────────────────────────────────

    async createTeam(input: {
        tournament_id: string;
        name: string;
        captain_uuid: string;
    }): Promise<TournamentTeam> {
        const captain = normalizeUuid(input.captain_uuid);
        const db = getSupabaseClient();
        if (db) {
            const { data, error } = await db
                .from('tournament_teams')
                .insert({
                    tournament_id: input.tournament_id,
                    name: input.name,
                    captain_uuid: captain,
                    pending_invites: [],
                })
                .select()
                .single();
            if (error || !data) throw new Error(error?.message ?? 'Failed to create team');
            return mapTeam(data as Record<string, unknown>);
        }
        const store = await jsonRead();
        const dup = store.teams.find(
            (t) =>
                t.tournament_id === input.tournament_id &&
                t.name.toLowerCase() === input.name.toLowerCase()
        );
        if (dup) throw new Error('A team with that name already exists');
        const record: TournamentTeam = {
            id: newId(),
            tournament_id: input.tournament_id,
            name: input.name,
            captain_uuid: captain,
            pending_invites: [],
            created_at: new Date().toISOString(),
        };
        store.teams.push(record);
        await jsonWrite(store);
        return record;
    },

    async getTeam(teamId: string): Promise<TournamentTeam | null> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('tournament_teams')
                .select('*')
                .eq('id', teamId)
                .maybeSingle();
            return data ? mapTeam(data as Record<string, unknown>) : null;
        }
        return (await jsonRead()).teams.find((t) => t.id === teamId) ?? null;
    },

    async getTeamByName(tournamentId: string, name: string): Promise<TournamentTeam | null> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('tournament_teams')
                .select('*')
                .eq('tournament_id', tournamentId)
                .ilike('name', name)
                .maybeSingle();
            return data ? mapTeam(data as Record<string, unknown>) : null;
        }
        const lower = name.toLowerCase();
        return (
            (await jsonRead()).teams.find(
                (t) => t.tournament_id === tournamentId && t.name.toLowerCase() === lower
            ) ?? null
        );
    },

    async listTeams(tournamentId: string): Promise<TournamentTeam[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('tournament_teams')
                .select('*')
                .eq('tournament_id', tournamentId)
                .order('created_at', { ascending: true });
            return ((data as Record<string, unknown>[]) ?? []).map(mapTeam);
        }
        return (await jsonRead()).teams
            .filter((t) => t.tournament_id === tournamentId)
            .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },

    async updateTeam(
        teamId: string,
        patch: Partial<Pick<TournamentTeam, 'captain_uuid' | 'pending_invites' | 'name'>>
    ): Promise<TournamentTeam | null> {
        const db = getSupabaseClient();
        if (db) {
            const payload: Record<string, unknown> = {};
            if (patch.captain_uuid !== undefined) {
                payload.captain_uuid = normalizeUuid(patch.captain_uuid);
            }
            if (patch.pending_invites !== undefined) {
                payload.pending_invites = patch.pending_invites.map(normalizeUuid);
            }
            if (patch.name !== undefined) payload.name = patch.name;
            const { data } = await db
                .from('tournament_teams')
                .update(payload)
                .eq('id', teamId)
                .select()
                .single();
            return data ? mapTeam(data as Record<string, unknown>) : null;
        }
        const store = await jsonRead();
        const team = store.teams.find((t) => t.id === teamId);
        if (!team) return null;
        if (patch.captain_uuid !== undefined) team.captain_uuid = normalizeUuid(patch.captain_uuid);
        if (patch.pending_invites !== undefined) {
            team.pending_invites = patch.pending_invites.map(normalizeUuid);
        }
        if (patch.name !== undefined) team.name = patch.name;
        await jsonWrite(store);
        return team;
    },

    async deleteTeam(teamId: string): Promise<void> {
        const db = getSupabaseClient();
        if (db) {
            // Clear participant team_id first (FK ON DELETE SET NULL also handles this)
            await db
                .from('tournament_participants')
                .update({ team_id: null })
                .eq('team_id', teamId);
            await db.from('tournament_teams').delete().eq('id', teamId);
            return;
        }
        const store = await jsonRead();
        for (const p of store.participants) {
            if (p.team_id === teamId) p.team_id = null;
        }
        store.teams = store.teams.filter((t) => t.id !== teamId);
        await jsonWrite(store);
    },

    async setParticipantTeam(
        tournamentId: string,
        uuid: string,
        teamId: string | null
    ): Promise<TournamentParticipant | null> {
        const norm = normalizeUuid(uuid);
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('tournament_participants')
                .update({ team_id: teamId })
                .eq('tournament_id', tournamentId)
                .eq('uuid', norm)
                .select()
                .single();
            return data ? mapParticipant(data as Record<string, unknown>) : null;
        }
        const store = await jsonRead();
        const p = store.participants.find(
            (x) => x.tournament_id === tournamentId && x.uuid === norm
        );
        if (!p) return null;
        p.team_id = teamId;
        await jsonWrite(store);
        return p;
    },

    async listTeamMembers(
        tournamentId: string,
        teamId: string
    ): Promise<TournamentParticipant[]> {
        const all = await tournamentsRepo.listParticipants(tournamentId);
        return all.filter((p) => p.team_id === teamId);
    },

    /**
     * Ensure a participant row exists (stub OK during draft before start snapshots).
     * Does not overwrite baseline_stats / status / team_id if already present.
     */
    async ensureParticipantStub(input: {
        tournament_id: string;
        uuid: string;
        username: string;
    }): Promise<TournamentParticipant> {
        const existing = await tournamentsRepo.getParticipant(input.tournament_id, input.uuid);
        if (existing) {
            if (existing.username !== input.username) {
                // Refresh display name only via upsert would clobber team — update lightly
                const db = getSupabaseClient();
                if (db) {
                    await db
                        .from('tournament_participants')
                        .update({ username: input.username })
                        .eq('id', existing.id);
                } else {
                    const store = await jsonRead();
                    const p = store.participants.find((x) => x.id === existing.id);
                    if (p) {
                        p.username = input.username;
                        await jsonWrite(store);
                    }
                }
                return { ...existing, username: input.username };
            }
            return existing;
        }
        return tournamentsRepo.upsertParticipant({
            tournament_id: input.tournament_id,
            uuid: input.uuid,
            username: input.username,
            baseline_stats: normalizeStats({}),
            status: 'active',
        });
    },

    // ── Week results + digests (Phase 3) ────────────────────────────────────────

    async setLastDailyDigestAt(tournamentId: string, iso: string): Promise<void> {
        const db = getSupabaseClient();
        if (db) {
            await db
                .from('tournaments')
                .update({ last_daily_digest_at: iso })
                .eq('id', tournamentId);
            return;
        }
        const store = await jsonRead();
        const t = store.tournaments.find((x) => x.id === tournamentId);
        if (t) {
            t.last_daily_digest_at = iso;
            await jsonWrite(store);
        }
    },

    async getWeekResult(
        tournamentId: string,
        weekNumber: number
    ): Promise<TournamentWeekResult | null> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('tournament_week_results')
                .select('*')
                .eq('tournament_id', tournamentId)
                .eq('week_number', weekNumber)
                .maybeSingle();
            return data ? mapWeekResult(data as Record<string, unknown>) : null;
        }
        return (
            (await jsonRead()).week_results.find(
                (r) => r.tournament_id === tournamentId && r.week_number === weekNumber
            ) ?? null
        );
    },

    async listWeekResults(tournamentId: string): Promise<TournamentWeekResult[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('tournament_week_results')
                .select('*')
                .eq('tournament_id', tournamentId)
                .order('week_number', { ascending: true });
            return ((data as Record<string, unknown>[]) ?? []).map(mapWeekResult);
        }
        return (await jsonRead()).week_results
            .filter((r) => r.tournament_id === tournamentId)
            .sort((a, b) => a.week_number - b.week_number);
    },

    /**
     * Persist frozen weekly podiums. Idempotent on (tournament_id, week_number):
     * if a result already exists it is returned unchanged (no recalc).
     */
    async freezeWeekResult(input: {
        tournament_id: string;
        week_number: number;
        week_starts_at: string;
        week_ends_at: string;
        solo_podium: WeekSoloPodiumEntry[];
        team_podium: WeekTeamPodiumEntry[];
    }): Promise<TournamentWeekResult> {
        const existing = await tournamentsRepo.getWeekResult(
            input.tournament_id,
            input.week_number
        );
        if (existing) return existing;

        const db = getSupabaseClient();
        if (db) {
            const { data, error } = await db
                .from('tournament_week_results')
                .insert({
                    tournament_id: input.tournament_id,
                    week_number: input.week_number,
                    week_starts_at: input.week_starts_at,
                    week_ends_at: input.week_ends_at,
                    solo_podium: input.solo_podium,
                    team_podium: input.team_podium,
                })
                .select()
                .single();
            if (error || !data) {
                // Race: another worker may have inserted — return that row
                const raced = await tournamentsRepo.getWeekResult(
                    input.tournament_id,
                    input.week_number
                );
                if (raced) return raced;
                throw new Error(error?.message ?? 'Failed to freeze week result');
            }
            return mapWeekResult(data as Record<string, unknown>);
        }

        const store = await jsonRead();
        const raced = store.week_results.find(
            (r) =>
                r.tournament_id === input.tournament_id &&
                r.week_number === input.week_number
        );
        if (raced) return raced;

        const record: TournamentWeekResult = {
            id: newId(),
            tournament_id: input.tournament_id,
            week_number: input.week_number,
            week_starts_at: input.week_starts_at,
            week_ends_at: input.week_ends_at,
            solo_podium: input.solo_podium,
            team_podium: input.team_podium,
            frozen_at: new Date().toISOString(),
        };
        store.week_results.push(record);
        await jsonWrite(store);
        return record;
    },

    // ── Online presence (Phase 5) ───────────────────────────────────────────────

    async openPresenceSession(uuid: string, username: string): Promise<TournamentOnlinePresence> {
        const norm = normalizeUuid(uuid);
        const now = new Date().toISOString();
        const db = getSupabaseClient();
        if (db) {
            // Upsert: restart streak if they were already "online" (missed leave)
            const { data, error } = await db
                .from('tournament_online_presence')
                .upsert(
                    {
                        uuid: norm,
                        username,
                        joined_at: now,
                        credited: false,
                    },
                    { onConflict: 'uuid' }
                )
                .select()
                .single();
            if (error || !data) throw new Error(error?.message ?? 'Failed to open presence');
            return mapPresence(data as Record<string, unknown>);
        }
        const store = await jsonRead();
        const existing = store.presence.find((p) => p.uuid === norm);
        if (existing) {
            existing.username = username;
            existing.joined_at = now;
            existing.credited = false;
            await jsonWrite(store);
            return existing;
        }
        const record: TournamentOnlinePresence = {
            uuid: norm,
            username,
            joined_at: now,
            credited: false,
        };
        store.presence.push(record);
        await jsonWrite(store);
        return record;
    },

    async getOpenPresenceSession(uuid: string): Promise<TournamentOnlinePresence | null> {
        const norm = normalizeUuid(uuid);
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('tournament_online_presence')
                .select('*')
                .eq('uuid', norm)
                .maybeSingle();
            return data ? mapPresence(data as Record<string, unknown>) : null;
        }
        return (await jsonRead()).presence.find((p) => p.uuid === norm) ?? null;
    },

    async listOpenPresenceSessions(): Promise<TournamentOnlinePresence[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('tournament_online_presence').select('*');
            return ((data as Record<string, unknown>[]) ?? []).map(mapPresence);
        }
        return (await jsonRead()).presence;
    },

    async markPresenceCredited(uuid: string): Promise<void> {
        const norm = normalizeUuid(uuid);
        const db = getSupabaseClient();
        if (db) {
            await db
                .from('tournament_online_presence')
                .update({ credited: true })
                .eq('uuid', norm);
            return;
        }
        const store = await jsonRead();
        const p = store.presence.find((x) => x.uuid === norm);
        if (p) {
            p.credited = true;
            await jsonWrite(store);
        }
    },

    async closePresenceSession(uuid: string): Promise<void> {
        const norm = normalizeUuid(uuid);
        const db = getSupabaseClient();
        if (db) {
            await db.from('tournament_online_presence').delete().eq('uuid', norm);
            return;
        }
        const store = await jsonRead();
        store.presence = store.presence.filter((p) => p.uuid !== norm);
        await jsonWrite(store);
    },
};
