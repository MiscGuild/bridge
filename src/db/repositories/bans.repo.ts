import { getSupabaseClient } from '@/db/client';
import { readJson, writeJson } from '@/db/json-store';

export interface BanRecord {
    id: string;
    uuid: string;
    username: string;
    ban_type: 'guild' | 'bridge' | 'command';
    reason: string;
    banned_by: string;
    banned_at: string;
    expires_at: string | null;
    is_active: boolean;
    discord_message_id: string | null;
}

export interface CreateBanInput {
    uuid: string;
    username: string;
    ban_type: 'guild' | 'bridge' | 'command';
    reason: string;
    banned_by: string;
    expires_at?: string | null;
    discord_message_id?: string | null;
}

// ── JSON fallback helpers ──────────────────────────────────────────────────────

const FILE = 'bans.json';

async function jsonRead(): Promise<BanRecord[]> {
    return readJson<BanRecord[]>(FILE, []);
}

async function jsonWrite(records: BanRecord[]): Promise<void> {
    return writeJson(FILE, records);
}

function newId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Repo ──────────────────────────────────────────────────────────────────────

export const bansRepo = {
    async getActive(): Promise<BanRecord[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('bans').select('*').eq('is_active', true);
            return (data as BanRecord[]) ?? [];
        }
        const records = await jsonRead();
        const now = new Date().toISOString();
        return records.filter(r => r.is_active && (!r.expires_at || r.expires_at > now));
    },

    async getByUuid(uuid: string): Promise<BanRecord | null> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('bans').select('*').eq('uuid', uuid).eq('is_active', true).maybeSingle();
            return (data as BanRecord | null) ?? null;
        }
        const records = await jsonRead();
        return records.find(r => r.uuid === uuid && r.is_active) ?? null;
    },

    async getByUsername(username: string): Promise<BanRecord | null> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('bans').select('*').ilike('username', username).eq('is_active', true).maybeSingle();
            return (data as BanRecord | null) ?? null;
        }
        const records = await jsonRead();
        return records.find(r => r.username.toLowerCase() === username.toLowerCase() && r.is_active) ?? null;
    },

    async create(input: CreateBanInput): Promise<BanRecord | null> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('bans').insert(input).select().single();
            return (data as BanRecord | null) ?? null;
        }
        const record: BanRecord = {
            id: newId(),
            ...input,
            banned_at: new Date().toISOString(),
            expires_at: input.expires_at ?? null,
            discord_message_id: input.discord_message_id ?? null,
            is_active: true,
        };
        const records = await jsonRead();
        records.push(record);
        await jsonWrite(records);
        return record;
    },

    async deactivate(id: string): Promise<void> {
        const db = getSupabaseClient();
        if (db) {
            await db.from('bans').update({ is_active: false }).eq('id', id);
            return;
        }
        const records = await jsonRead();
        const rec = records.find(r => r.id === id);
        if (rec) { rec.is_active = false; await jsonWrite(records); }
    },

    async removeByUsername(username: string): Promise<void> {
        const db = getSupabaseClient();
        if (db) {
            await db.from('bans').update({ is_active: false }).ilike('username', username).eq('is_active', true);
            return;
        }
        const records = await jsonRead();
        let changed = false;
        for (const r of records) {
            if (r.username.toLowerCase() === username.toLowerCase() && r.is_active) {
                r.is_active = false;
                changed = true;
            }
        }
        if (changed) await jsonWrite(records);
    },

    async expireOverdue(): Promise<void> {
        const db = getSupabaseClient();
        if (db) {
            await db.from('bans').update({ is_active: false }).eq('is_active', true).lt('expires_at', new Date().toISOString());
            return;
        }
        const now = new Date().toISOString();
        const records = await jsonRead();
        let changed = false;
        for (const r of records) {
            if (r.is_active && r.expires_at && r.expires_at < now) {
                r.is_active = false;
                changed = true;
            }
        }
        if (changed) await jsonWrite(records);
    },
};
