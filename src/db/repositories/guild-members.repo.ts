import { getSupabaseClient } from '@/db/client';

export interface GuildMember {
    uuid: string;
    username: string;
    rank: string | null;
    joined_at: string;
    left_at: string | null;
    is_active: boolean;
    updated_at: string;
}

export const guildMembersRepo = {
    async upsert(uuid: string, username: string, rank: string | null): Promise<void> {
        const db = getSupabaseClient();
        if (!db) return;
        await db.from('guild_members').upsert({
            uuid,
            username,
            rank,
            is_active: true,
            left_at: null,
            updated_at: new Date().toISOString(),
        });
    },

    async markLeft(uuid: string): Promise<void> {
        const db = getSupabaseClient();
        if (!db) return;
        await db
            .from('guild_members')
            .update({
                is_active: false,
                left_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('uuid', uuid);
    },

    async updateRank(uuid: string, rank: string): Promise<void> {
        const db = getSupabaseClient();
        if (!db) return;
        await db
            .from('guild_members')
            .update({
                rank,
                updated_at: new Date().toISOString(),
            })
            .eq('uuid', uuid);
    },

    async getActive(): Promise<GuildMember[]> {
        const db = getSupabaseClient();
        if (!db) return [];
        const { data } = await db.from('guild_members').select('*').eq('is_active', true);
        return (data as GuildMember[]) ?? [];
    },

    async getByUuid(uuid: string): Promise<GuildMember | null> {
        const db = getSupabaseClient();
        if (!db) return null;
        const { data } = await db.from('guild_members').select('*').eq('uuid', uuid).maybeSingle();
        return (data as GuildMember | null) ?? null;
    },
};
