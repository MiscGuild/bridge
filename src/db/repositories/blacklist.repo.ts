import { getSupabaseClient } from '@/db/client';
import { readJson, writeJson } from '@/db/json-store';

export interface BlacklistRecord {
    id: string;
    uuid: string;
    username: string;
    reason: string;
    added_by: string;
    added_at: string;
    expires_at: string | null;
    is_active: boolean;
    discord_message_id: string | null;
}

export interface CreateBlacklistInput {
    uuid: string;
    username: string;
    reason: string;
    added_by: string;
    expires_at?: string | null;
    discord_message_id?: string | null;
}

// ── JSON fallback helpers ──────────────────────────────────────────────────────

const FILE = 'blacklist.json';

async function jsonRead(): Promise<BlacklistRecord[]> {
    return readJson<BlacklistRecord[]>(FILE, []);
}

async function jsonWrite(records: BlacklistRecord[]): Promise<void> {
    return writeJson(FILE, records);
}

function newId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Repo ──────────────────────────────────────────────────────────────────────

export const blacklistRepo = {
    /**
     * Bulk-reactivate any permanent entries (expires_at IS NULL) that were
     * mistakenly deactivated. Permanent blacklists must always remain active.
     * Returns the number of rows that were repaired.
     */
    async reactivatePermanent(): Promise<number> {
        const db = getSupabaseClient();
        if (db) {
            const { data, error } = await db
                .from('blacklist')
                .update({ is_active: true })
                .is('expires_at', null)
                .eq('is_active', false)
                .select('id');
            if (error) return 0;
            return (data as { id: string }[] | null)?.length ?? 0;
        }
        const records = await jsonRead();
        let count = 0;
        for (const r of records) {
            if (r.expires_at === null && r.is_active === false) {
                r.is_active = true;
                count++;
            }
        }
        if (count > 0) await jsonWrite(records);
        return count;
    },

    async getAll(): Promise<BlacklistRecord[]> {
        // Self-heal any permanent entries that were deactivated before returning.
        await blacklistRepo.reactivatePermanent().catch(() => 0);

        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('blacklist').select('*').eq('is_active', true);
            return filterExpired((data as BlacklistRecord[]) ?? []);
        }
        return filterExpired((await jsonRead()).filter((r) => r.is_active));
    },

    async getByUuid(uuid: string): Promise<BlacklistRecord | null> {
        const db = getSupabaseClient();
        let record: BlacklistRecord | null;
        if (db) {
            // Match active OR permanent (expires_at IS NULL) entries — permanent
            // entries are always considered active even if is_active was flipped.
            const { data } = await db
                .from('blacklist')
                .select('*')
                .eq('uuid', uuid)
                .or('is_active.eq.true,expires_at.is.null')
                .order('added_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            record = (data as BlacklistRecord | null) ?? null;
        } else {
            record =
                (await jsonRead()).find(
                    (r) => r.uuid === uuid && (r.is_active || r.expires_at === null)
                ) ?? null;
        }
        if (record && isExpired(record)) {
            await blacklistRepo.deactivate(record.id).catch(() => {});
            return null;
        }
        // If we found a permanent entry that was somehow deactivated, repair it.
        if (record && !record.is_active && record.expires_at === null) {
            await blacklistRepo.reactivate(record.id).catch(() => {});
            record.is_active = true;
        }
        return record;
    },

    async isBlacklisted(uuid: string): Promise<boolean> {
        return (await blacklistRepo.getByUuid(uuid)) !== null;
    },

    async create(input: CreateBlacklistInput): Promise<BlacklistRecord | null> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('blacklist').insert(input).select().single();
            return (data as BlacklistRecord | null) ?? null;
        }
        const record: BlacklistRecord = {
            id: newId(),
            ...input,
            added_at: new Date().toISOString(),
            expires_at: input.expires_at ?? null,
            discord_message_id: input.discord_message_id ?? null,
            is_active: true,
        };
        const records = await jsonRead();
        records.push(record);
        await jsonWrite(records);
        return record;
    },

    async add(input: CreateBlacklistInput): Promise<BlacklistRecord | null> {
        return blacklistRepo.create(input);
    },

    async remove(uuid: string): Promise<void> {
        // Explicit removal (e.g. !blacklist remove) — allowed even for permanent entries.
        const db = getSupabaseClient();
        if (db) {
            await db.from('blacklist').update({ is_active: false }).eq('uuid', uuid);
            return;
        }
        const records = await jsonRead();
        const rec = records.find((r) => r.uuid === uuid && r.is_active);
        if (rec) {
            rec.is_active = false;
            await jsonWrite(records);
        }
    },

    /** Re-enable a previously deactivated entry by id. */
    async reactivate(id: string): Promise<void> {
        const db = getSupabaseClient();
        if (db) {
            await db.from('blacklist').update({ is_active: true }).eq('id', id);
            return;
        }
        const records = await jsonRead();
        const rec = records.find((r) => r.id === id);
        if (rec) {
            rec.is_active = true;
            await jsonWrite(records);
        }
    },

    async deactivate(id: string): Promise<void> {
        // Refuse to deactivate permanent entries — they must stay active.
        const db = getSupabaseClient();
        if (db) {
            await db
                .from('blacklist')
                .update({ is_active: false })
                .eq('id', id)
                .not('expires_at', 'is', null);
            return;
        }
        const records = await jsonRead();
        const rec = records.find((r) => r.id === id);
        if (rec && rec.expires_at !== null) {
            rec.is_active = false;
            await jsonWrite(records);
        }
    },

    /** Deactivate all entries whose expires_at has passed. Returns the full deactivated records. */
    async expireOverdue(): Promise<BlacklistRecord[]> {
        const all = await (async () => {
            const db = getSupabaseClient();
            if (db) {
                const { data } = await db.from('blacklist').select('*').eq('is_active', true);
                return (data as BlacklistRecord[]) ?? [];
            }
            return (await jsonRead()).filter((r) => r.is_active);
        })();

        const expired: BlacklistRecord[] = [];
        for (const r of all) {
            if (isExpired(r)) {
                await blacklistRepo.deactivate(r.id).catch(() => {});
                expired.push(r);
            }
        }
        return expired;
    },

    /**
     * Extend an active entry's expires_at by `addMs` milliseconds.
     * No-op (returns existing record) if the entry is permanent (expires_at is null) or missing.
     */
    async extendExpiry(uuid: string, addMs: number): Promise<BlacklistRecord | null> {
        const db = getSupabaseClient();
        let record: BlacklistRecord | null = null;
        if (db) {
            const { data } = await db
                .from('blacklist')
                .select('*')
                .eq('uuid', uuid)
                .eq('is_active', true)
                .maybeSingle();
            record = (data as BlacklistRecord | null) ?? null;
        } else {
            record =
                (await jsonRead()).find((r) => r.uuid === uuid && r.is_active) ?? null;
        }
        if (!record) return null;
        if (!record.expires_at) return record; // permanent — leave unchanged

        const base = Math.max(Date.now(), new Date(record.expires_at).getTime());
        const newExpiry = new Date(base + addMs).toISOString();

        if (db) {
            const { data } = await db
                .from('blacklist')
                .update({ expires_at: newExpiry })
                .eq('id', record.id)
                .select()
                .single();
            return (data as BlacklistRecord | null) ?? { ...record, expires_at: newExpiry };
        }
        const records = await jsonRead();
        const idx = records.findIndex((r) => r.id === record!.id);
        if (idx >= 0) {
            records[idx]!.expires_at = newExpiry;
            await jsonWrite(records);
            return records[idx]!;
        }
        return { ...record, expires_at: newExpiry };
    },

    /** Update the discord_message_id field for a record (used after the embed is posted). */
    async setDiscordMessageId(id: string, messageId: string): Promise<void> {
        const db = getSupabaseClient();
        if (db) {
            await db.from('blacklist').update({ discord_message_id: messageId }).eq('id', id);
            return;
        }
        const records = await jsonRead();
        const rec = records.find((r) => r.id === id);
        if (rec) {
            rec.discord_message_id = messageId;
            await jsonWrite(records);
        }
    },
};

function isExpired(r: BlacklistRecord): boolean {
    return !!r.expires_at && new Date(r.expires_at).getTime() <= Date.now();
}

function filterExpired(records: BlacklistRecord[]): BlacklistRecord[] {
    return records.filter((r) => !isExpired(r));
}
