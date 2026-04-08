import { getSupabaseClient } from '@/db/client';

export interface AnalyticsDailyRecord {
    date: string;
    total_messages: number;
    unique_chatters: number;
    joins: number;
    leaves: number;
    kicks: number;
    promotions: number;
    demotions: number;
    quest_completions: number;
}

export interface ChatterRecord {
    date: string;
    uuid: string;
    username: string;
    message_count: number;
}

export type AnalyticsDailyKey = Exclude<keyof AnalyticsDailyRecord, 'date' | 'unique_chatters'>;

export const analyticsRepo = {
    async getToday(): Promise<AnalyticsDailyRecord | null> {
        const db = getSupabaseClient();
        if (!db) return null;
        const today = new Date().toISOString().slice(0, 10);
        const { data } = await db
            .from('analytics_daily')
            .select('*')
            .eq('date', today)
            .maybeSingle();
        return (data as AnalyticsDailyRecord | null) ?? null;
    },

    async increment(field: AnalyticsDailyKey, amount = 1): Promise<void> {
        const db = getSupabaseClient();
        if (!db) return;
        const today = new Date().toISOString().slice(0, 10);
        await db.rpc('increment_analytics', { p_date: today, p_field: field, p_amount: amount });
    },

    async recordChatter(uuid: string, username: string): Promise<void> {
        const db = getSupabaseClient();
        if (!db) return;
        const today = new Date().toISOString().slice(0, 10);
        await db.rpc('upsert_chatter', { p_date: today, p_uuid: uuid, p_username: username });
    },

    async getRange(startDate: string, endDate: string): Promise<AnalyticsDailyRecord[]> {
        const db = getSupabaseClient();
        if (!db) return [];
        const { data } = await db
            .from('analytics_daily')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });
        return (data as AnalyticsDailyRecord[]) ?? [];
    },

    async getTopChatters(date: string, limit = 10): Promise<ChatterRecord[]> {
        const db = getSupabaseClient();
        if (!db) return [];
        const { data } = await db
            .from('analytics_chatters')
            .select('*')
            .eq('date', date)
            .order('message_count', { ascending: false })
            .limit(limit);
        return (data as ChatterRecord[]) ?? [];
    },
};
