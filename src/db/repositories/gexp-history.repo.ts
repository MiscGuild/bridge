import { getSupabaseClient } from '@/db/client';
import { readJson, writeJson } from '@/db/json-store';

export interface GexpDailyRecord {
    date: string; // YYYY-MM-DD
    uuid: string;
    username: string;
    gexp_earned: number;
}

// ── JSON fallback ──────────────────────────────────────────────────────────────

const FILE = 'gexp-history.json';

async function jsonRead(): Promise<GexpDailyRecord[]> {
    return readJson<GexpDailyRecord[]>(FILE, []);
}

async function jsonWrite(records: GexpDailyRecord[]): Promise<void> {
    return writeJson(FILE, records);
}

// ── Repo ──────────────────────────────────────────────────────────────────────

export const gexpHistoryRepo = {
    /** Upsert a batch of daily GEXP records (from Hypixel API expHistory) */
    async upsertBatch(records: GexpDailyRecord[]): Promise<void> {
        if (records.length === 0) return;

        const db = getSupabaseClient();
        if (db) {
            // Supabase upsert on composite key (date, uuid)
            await db.from('gexp_daily').upsert(records, { onConflict: 'date,uuid' });
            return;
        }

        // JSON fallback — merge by (date, uuid)
        const existing = await jsonRead();
        const key = (r: GexpDailyRecord) => `${r.date}|${r.uuid}`;
        const map = new Map(existing.map((r) => [key(r), r]));
        for (const r of records) map.set(key(r), r);
        await jsonWrite([...map.values()]);
    },

    /** Get GEXP history for a single player within a date range */
    async getPlayerHistory(
        uuid: string,
        startDate: string,
        endDate: string
    ): Promise<GexpDailyRecord[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('gexp_daily')
                .select('*')
                .eq('uuid', uuid)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true });
            return (data as GexpDailyRecord[]) ?? [];
        }

        const all = await jsonRead();
        return all
            .filter((r) => r.uuid === uuid && r.date >= startDate && r.date <= endDate)
            .sort((a, b) => a.date.localeCompare(b.date));
    },

    /** Get total GEXP per player in a date range, sorted descending */
    async getLeaderboard(
        startDate: string,
        endDate: string,
        limit = 20
    ): Promise<{ uuid: string; username: string; total: number }[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.rpc('gexp_leaderboard', {
                p_start: startDate,
                p_end: endDate,
                p_limit: limit,
            });
            return (data as { uuid: string; username: string; total: number }[]) ?? [];
        }

        // JSON fallback — aggregate in memory
        const all = await jsonRead();
        const filtered = all.filter((r) => r.date >= startDate && r.date <= endDate);
        const totals = new Map<string, { username: string; total: number }>();
        for (const r of filtered) {
            const entry = totals.get(r.uuid) ?? { username: r.username, total: 0 };
            entry.total += r.gexp_earned;
            entry.username = r.username; // keep latest name
            totals.set(r.uuid, entry);
        }
        return [...totals.entries()]
            .map(([uuid, { username, total }]) => ({ uuid, username, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    },

    /** Get all records for a single date (for daily guild totals) */
    async getDay(date: string): Promise<GexpDailyRecord[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('gexp_daily')
                .select('*')
                .eq('date', date)
                .order('gexp_earned', { ascending: false });
            return (data as GexpDailyRecord[]) ?? [];
        }

        const all = await jsonRead();
        return all.filter((r) => r.date === date).sort((a, b) => b.gexp_earned - a.gexp_earned);
    },
};
