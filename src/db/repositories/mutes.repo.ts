import { getSupabaseClient } from '@/db/client';
import { readJson, writeJson } from '@/db/json-store';

export interface MuteRecord {
    id: string;
    uuid: string;
    username: string;
    discord_id: string | null;
    reason: string;
    muted_by: string;
    muted_at: string;
    expires_at: string | null;
    is_active: boolean;
}

export interface WarnRecord {
    id: string;
    uuid: string;
    username: string;
    discord_id: string | null;
    reason: string;
    warned_by: string;
    warned_at: string;
}

export interface CreateMuteInput {
    uuid: string;
    username: string;
    discord_id?: string | null;
    reason: string;
    muted_by: string;
    expires_at?: string | null;
}

export interface CreateWarnInput {
    uuid: string;
    username: string;
    discord_id?: string | null;
    reason: string;
    warned_by: string;
}

// ── JSON fallback ─────────────────────────────────────────────────────────────

const MUTES_FILE = 'mutes.json';
const WARNS_FILE = 'warns.json';

async function readMutes(): Promise<MuteRecord[]> { return readJson<MuteRecord[]>(MUTES_FILE, []); }
async function writeMutes(r: MuteRecord[]): Promise<void> { return writeJson(MUTES_FILE, r); }
async function readWarns(): Promise<WarnRecord[]> { return readJson<WarnRecord[]>(WARNS_FILE, []); }
async function writeWarns(r: WarnRecord[]): Promise<void> { return writeJson(WARNS_FILE, r); }

function newId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Mutes Repo ────────────────────────────────────────────────────────────────

export const mutesRepo = {
    async getActive(): Promise<MuteRecord[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('mutes').select('*').eq('is_active', true);
            return (data as MuteRecord[]) ?? [];
        }
        const all = await readMutes();
        const now = new Date().toISOString();
        return all.filter(m => m.is_active && (!m.expires_at || m.expires_at > now));
    },

    async getByUsername(username: string): Promise<MuteRecord | null> {
        const active = await this.getActive();
        return active.find(m => m.username.toLowerCase() === username.toLowerCase()) ?? null;
    },

    async create(input: CreateMuteInput): Promise<MuteRecord | null> {
        const record: MuteRecord = {
            id: newId(),
            uuid: input.uuid,
            username: input.username,
            discord_id: input.discord_id ?? null,
            reason: input.reason,
            muted_by: input.muted_by,
            muted_at: new Date().toISOString(),
            expires_at: input.expires_at ?? null,
            is_active: true,
        };

        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('mutes').insert(record).select().single();
            return (data as MuteRecord) ?? record;
        }
        const all = await readMutes();
        all.push(record);
        await writeMutes(all);
        return record;
    },

    async deactivateByUsername(username: string): Promise<void> {
        const db = getSupabaseClient();
        if (db) {
            await db.from('mutes').update({ is_active: false })
                .eq('is_active', true)
                .ilike('username', username);
            return;
        }
        const all = await readMutes();
        for (const m of all) {
            if (m.username.toLowerCase() === username.toLowerCase() && m.is_active) {
                m.is_active = false;
            }
        }
        await writeMutes(all);
    },

    async expireOverdue(): Promise<void> {
        const now = new Date().toISOString();
        const db = getSupabaseClient();
        if (db) {
            await db.from('mutes').update({ is_active: false })
                .eq('is_active', true)
                .not('expires_at', 'is', null)
                .lt('expires_at', now);
            return;
        }
        const all = await readMutes();
        let changed = false;
        for (const m of all) {
            if (m.is_active && m.expires_at && m.expires_at < now) {
                m.is_active = false;
                changed = true;
            }
        }
        if (changed) await writeMutes(all);
    },
};

// ── Warns Repo ────────────────────────────────────────────────────────────────

export const warnsRepo = {
    async getByUsername(username: string): Promise<WarnRecord[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('warns').select('*').ilike('username', username);
            return (data as WarnRecord[]) ?? [];
        }
        const all = await readWarns();
        return all.filter(w => w.username.toLowerCase() === username.toLowerCase());
    },

    async create(input: CreateWarnInput): Promise<WarnRecord | null> {
        const record: WarnRecord = {
            id: newId(),
            uuid: input.uuid,
            username: input.username,
            discord_id: input.discord_id ?? null,
            reason: input.reason,
            warned_by: input.warned_by,
            warned_at: new Date().toISOString(),
        };

        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('warns').insert(record).select().single();
            return (data as WarnRecord) ?? record;
        }
        const all = await readWarns();
        all.push(record);
        await writeWarns(all);
        return record;
    },

    async clearByUsername(username: string): Promise<number> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db.from('warns').delete()
                .ilike('username', username).select('id');
            return data?.length ?? 0;
        }
        const all = await readWarns();
        const before = all.length;
        const filtered = all.filter(w => w.username.toLowerCase() !== username.toLowerCase());
        await writeWarns(filtered);
        return before - filtered.length;
    },
};
