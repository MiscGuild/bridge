import { getSupabaseClient } from '@/db/client';

export interface WebhookRecord {
    id: string;
    name: string;
    url: string;
    events: string[];
    secret: string | null;
    is_active: boolean;
    created_at: string;
}

export interface CreateWebhookInput {
    name: string;
    url: string;
    events: string[];
    secret?: string | null;
}

export const webhooksRepo = {
    async getAll(): Promise<WebhookRecord[]> {
        const db = getSupabaseClient();
        if (!db) return [];
        const { data } = await db.from('webhooks').select('*').eq('is_active', true);
        return (data as WebhookRecord[]) ?? [];
    },

    async getForEvent(eventName: string): Promise<WebhookRecord[]> {
        const db = getSupabaseClient();
        if (!db) return [];
        const { data } = await db
            .from('webhooks')
            .select('*')
            .eq('is_active', true)
            .contains('events', [eventName]);
        return (data as WebhookRecord[]) ?? [];
    },

    async create(input: CreateWebhookInput): Promise<WebhookRecord | null> {
        const db = getSupabaseClient();
        if (!db) return null;
        const { data } = await db.from('webhooks').insert(input).select().single();
        return (data as WebhookRecord | null) ?? null;
    },

    async deactivate(id: string): Promise<void> {
        const db = getSupabaseClient();
        if (!db) return;
        await db.from('webhooks').update({ is_active: false }).eq('id', id);
    },
};
