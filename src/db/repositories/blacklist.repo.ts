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
    async getAll(): Promise<BlacklistRecord[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('blacklist').select('*').eq('is_active', true);
            return (data as BlacklistRecord[]) ?? [];
        }
        return (await jsonRead()).filter(r => r.is_active);
    },

    async getByUuid(uuid: string): Promise<BlacklistRecord | null> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('blacklist').select('*').eq('uuid', uuid).eq('is_active', true).maybeSingle();
            return (data as BlacklistRecord | null) ?? null;
        }
        return (await jsonRead()).find(r => r.uuid === uuid && r.is_active) ?? null;
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
        const db = getSupabaseClient();
        if (db) {
            await db.from('blacklist').update({ is_active: false }).eq('uuid', uuid);
            return;
        }
        const records = await jsonRead();
        const rec = records.find(r => r.uuid === uuid && r.is_active);
        if (rec) { rec.is_active = false; await jsonWrite(records); }
    },

    async deactivate(id: string): Promise<void> {
        const db = getSupabaseClient();
        if (db) {
            await db.from('blacklist').update({ is_active: false }).eq('id', id);
            return;
        }
        const records = await jsonRead();
        const rec = records.find(r => r.id === id);
        if (rec) { rec.is_active = false; await jsonWrite(records); }
    },
};
