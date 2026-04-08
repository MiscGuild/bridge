import { getSupabaseClient } from '@/db/client';

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

export const bansRepo = {
    async getActive(): Promise<BanRecord[]> {
        const db = getSupabaseClient();
        if (!db) return [];
        const { data } = await db.from('bans').select('*').eq('is_active', true);
        return (data as BanRecord[]) ?? [];
    },

    async getByUuid(uuid: string): Promise<BanRecord | null> {
        const db = getSupabaseClient();
        if (!db) return null;
        const { data } = await db
            .from('bans')
            .select('*')
            .eq('uuid', uuid)
            .eq('is_active', true)
            .maybeSingle();
        return (data as BanRecord | null) ?? null;
    },

    async getByUsername(username: string): Promise<BanRecord | null> {
        const db = getSupabaseClient();
        if (!db) return null;
        const { data } = await db
            .from('bans')
            .select('*')
            .ilike('username', username)
            .eq('is_active', true)
            .maybeSingle();
        return (data as BanRecord | null) ?? null;
    },

    async create(input: CreateBanInput): Promise<BanRecord | null> {
        const db = getSupabaseClient();
        if (!db) return null;
        const { data } = await db.from('bans').insert(input).select().single();
        return (data as BanRecord | null) ?? null;
    },

    async deactivate(id: string): Promise<void> {
        const db = getSupabaseClient();
        if (!db) return;
        await db.from('bans').update({ is_active: false }).eq('id', id);
    },

    async expireOverdue(): Promise<void> {
        const db = getSupabaseClient();
        if (!db) return;
        await db
            .from('bans')
            .update({ is_active: false })
            .eq('is_active', true)
            .lt('expires_at', new Date().toISOString());
    },
};
