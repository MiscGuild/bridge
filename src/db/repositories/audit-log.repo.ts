import { getSupabaseClient } from '@/db/client';

export interface AuditLogEntry {
    id: number;
    actor: string;
    action: string;
    target: string | null;
    details: Record<string, unknown> | null;
    timestamp: string;
}

export const auditLogRepo = {
    async log(
        actor: string,
        action: string,
        target?: string,
        details?: Record<string, unknown>
    ): Promise<void> {
        const db = getSupabaseClient();
        if (!db) return;
        await db.from('audit_log').insert({ actor, action, target, details });
    },

    async getRecent(limit = 50): Promise<AuditLogEntry[]> {
        const db = getSupabaseClient();
        if (!db) return [];
        const { data } = await db
            .from('audit_log')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);
        return (data as AuditLogEntry[]) ?? [];
    },

    async getByActor(actor: string, limit = 50): Promise<AuditLogEntry[]> {
        const db = getSupabaseClient();
        if (!db) return [];
        const { data } = await db
            .from('audit_log')
            .select('*')
            .eq('actor', actor)
            .order('timestamp', { ascending: false })
            .limit(limit);
        return (data as AuditLogEntry[]) ?? [];
    },
};
