import { getSupabaseClient } from '@/db/client';

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

export const sessionsRepo = {
    async create(input: CreateSessionInput): Promise<SessionRecord | null> {
        const db = getSupabaseClient();
        if (!db) return null;
        const { data } = await db.from('sessions').insert(input).select().single();
        return (data as SessionRecord | null) ?? null;
    },

    async complete(
        id: string,
        end_stats: Record<string, unknown>,
        gained_stats: Record<string, unknown>
    ): Promise<void> {
        const db = getSupabaseClient();
        if (!db) return;
        await db
            .from('sessions')
            .update({ end_stats, gained_stats, ended_at: new Date().toISOString(), status: 'completed' })
            .eq('id', id);
    },

    async getActive(username: string): Promise<SessionRecord | null> {
        const db = getSupabaseClient();
        if (!db) return null;
        const { data } = await db
            .from('sessions')
            .select('*')
            .ilike('username', username)
            .eq('status', 'active')
            .maybeSingle();
        return (data as SessionRecord | null) ?? null;
    },

    async getHistory(username: string, limit = 10): Promise<SessionRecord[]> {
        const db = getSupabaseClient();
        if (!db) return [];
        const { data } = await db
            .from('sessions')
            .select('*')
            .ilike('username', username)
            .eq('status', 'completed')
            .order('started_at', { ascending: false })
            .limit(limit);
        return (data as SessionRecord[]) ?? [];
    },

    async expireStale(): Promise<void> {
        const db = getSupabaseClient();
        if (!db) return;
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        await db
            .from('sessions')
            .update({ status: 'expired', ended_at: new Date().toISOString() })
            .eq('status', 'active')
            .lt('started_at', cutoff);
    },
};
