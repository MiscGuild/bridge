import { getSupabaseClient } from '@/db/client';
import { readJson, writeJson } from '@/db/json-store';

export interface SessionRecord {
    id: string;
    user_uuid: string;
    username: string;
    game_mode: string;
    start_stats: Record<string, unknown> | null;
    end_stats: Record<string, unknown> | null;
    gained_stats: Record<string, unknown> | null;
    started_at: string;
    ended_at: string | null;
    status: 'active' | 'completed' | 'expired';
}

export interface CreateSessionInput {
    user_uuid: string;
    username: string;
    game_mode: string;
    start_stats?: Record<string, unknown>;
}

// ── JSON fallback ──────────────────────────────────────────────────────────────

const FILE = 'sessions.json';

async function jsonRead(): Promise<SessionRecord[]> {
    return readJson<SessionRecord[]>(FILE, []);
}

async function jsonWrite(records: SessionRecord[]): Promise<void> {
    return writeJson(FILE, records);
}

function newId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Repo ──────────────────────────────────────────────────────────────────────

export const sessionsRepo = {
    async create(input: CreateSessionInput): Promise<SessionRecord | null> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('sessions').insert(input).select().single();
            return (data as SessionRecord | null) ?? null;
        }
        const record: SessionRecord = {
            id: newId(),
            ...input,
            start_stats: input.start_stats ?? null,
            end_stats: null,
            gained_stats: null,
            started_at: new Date().toISOString(),
            ended_at: null,
            status: 'active',
        };
        const records = await jsonRead();
        records.push(record);
        await jsonWrite(records);
        return record;
    },

    async complete(
        id: string,
        end_stats: Record<string, unknown>,
        gained_stats: Record<string, unknown>
    ): Promise<void> {
        const db = getSupabaseClient();
        if (db) {
            await db.from('sessions').update({ end_stats, gained_stats, ended_at: new Date().toISOString(), status: 'completed' }).eq('id', id);
            return;
        }
        const records = await jsonRead();
        const rec = records.find(r => r.id === id);
        if (rec) {
            rec.end_stats = end_stats;
            rec.gained_stats = gained_stats;
            rec.ended_at = new Date().toISOString();
            rec.status = 'completed';
            await jsonWrite(records);
        }
    },

    async getActive(username: string): Promise<SessionRecord | null> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('sessions').select('*').ilike('username', username).eq('status', 'active').maybeSingle();
            return (data as SessionRecord | null) ?? null;
        }
        return (await jsonRead()).find(r => r.username.toLowerCase() === username.toLowerCase() && r.status === 'active') ?? null;
    },

    async getHistory(username: string, limit = 10): Promise<SessionRecord[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('sessions').select('*').ilike('username', username).eq('status', 'completed').order('started_at', { ascending: false }).limit(limit);
            return (data as SessionRecord[]) ?? [];
        }
        return (await jsonRead())
            .filter(r => r.username.toLowerCase() === username.toLowerCase() && r.status === 'completed')
            .sort((a, b) => b.started_at.localeCompare(a.started_at))
            .slice(0, limit);
    },

    async expireStale(): Promise<void> {
        const db = getSupabaseClient();
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        if (db) {
            await db.from('sessions').update({ status: 'expired', ended_at: new Date().toISOString() }).eq('status', 'active').lt('started_at', cutoff);
            return;
        }
        const records = await jsonRead();
        let changed = false;
        for (const r of records) {
            if (r.status === 'active' && r.started_at < cutoff) {
                r.status = 'expired';
                r.ended_at = new Date().toISOString();
                changed = true;
            }
        }
        if (changed) await jsonWrite(records);
    },
};
