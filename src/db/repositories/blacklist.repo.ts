import { getSupabaseClient } from '@/db/client';

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

export const blacklistRepo = {
    async getAll(): Promise<BlacklistRecord[]> {
        const db = getSupabaseClient();
        if (!db) return [];
        const { data } = await db.from('blacklist').select('*').eq('is_active', true);
        return (data as BlacklistRecord[]) ?? [];
    },

    async getByUuid(uuid: string): Promise<BlacklistRecord | null> {
        const db = getSupabaseClient();
        if (!db) return null;
        const { data } = await db
            .from('blacklist')
            .select('*')
            .eq('uuid', uuid)
            .eq('is_active', true)
            .maybeSingle();
        return (data as BlacklistRecord | null) ?? null;
    },

    async isBlacklisted(uuid: string): Promise<boolean> {
        const record = await blacklistRepo.getByUuid(uuid);
        return record !== null;
    },

    async create(input: CreateBlacklistInput): Promise<BlacklistRecord | null> {
        const db = getSupabaseClient();
        if (!db) return null;
        const { data } = await db.from('blacklist').insert(input).select().single();
        return (data as BlacklistRecord | null) ?? null;
    },

    async deactivate(id: string): Promise<void> {
        const db = getSupabaseClient();
        if (!db) return;
        await db.from('blacklist').update({ is_active: false }).eq('id', id);
    },
};
