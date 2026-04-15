import { getSupabaseClient } from '@/db/client';
import { readJson, writeJson } from '@/db/json-store';

export interface InviteRecord {
    id: string;
    inviter: string;
    invitee: string;
    invitee_uuid: string;
    status: 'pending' | 'accepted' | 'expired';
    invited_at: string;
    accepted_at: string | null;
}

const FILE = 'invites.json';

async function jsonRead(): Promise<InviteRecord[]> {
    return readJson<InviteRecord[]>(FILE, []);
}
async function jsonWrite(records: InviteRecord[]): Promise<void> {
    return writeJson(FILE, records);
}
function newId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const inviteRepo = {
    async create(inviter: string, invitee: string, inviteeUuid: string): Promise<InviteRecord> {
        const record: InviteRecord = {
            id: newId(),
            inviter,
            invitee,
            invitee_uuid: inviteeUuid,
            status: 'pending',
            invited_at: new Date().toISOString(),
            accepted_at: null,
        };

        const db = getSupabaseClient();
        if (db) {
            await db.from('guild_invites').insert(record);
        } else {
            const records = await jsonRead();
            records.push(record);
            await jsonWrite(records);
        }
        return record;
    },

    async markAccepted(invitee: string): Promise<void> {
        const db = getSupabaseClient();
        if (db) {
            await db
                .from('guild_invites')
                .update({ status: 'accepted', accepted_at: new Date().toISOString() })
                .eq('invitee', invitee)
                .eq('status', 'pending');
            return;
        }
        const records = await jsonRead();
        const rec = records.find(
            (r) => r.invitee.toLowerCase() === invitee.toLowerCase() && r.status === 'pending'
        );
        if (rec) {
            rec.status = 'accepted';
            rec.accepted_at = new Date().toISOString();
            await jsonWrite(records);
        }
    },

    async getByInviter(inviter: string, limit = 25): Promise<InviteRecord[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('guild_invites')
                .select('*')
                .ilike('inviter', inviter)
                .order('invited_at', { ascending: false })
                .limit(limit);
            return (data as InviteRecord[]) ?? [];
        }
        return (await jsonRead())
            .filter((r) => r.inviter.toLowerCase() === inviter.toLowerCase())
            .sort((a, b) => new Date(b.invited_at).getTime() - new Date(a.invited_at).getTime())
            .slice(0, limit);
    },

    async getRecent(limit = 25): Promise<InviteRecord[]> {
        const db = getSupabaseClient();
        if (db) {
            const { data } = await db
                .from('guild_invites')
                .select('*')
                .order('invited_at', { ascending: false })
                .limit(limit);
            return (data as InviteRecord[]) ?? [];
        }
        return (await jsonRead())
            .sort((a, b) => new Date(b.invited_at).getTime() - new Date(a.invited_at).getTime())
            .slice(0, limit);
    },

    async getStats(): Promise<{ inviter: string; total: number; accepted: number }[]> {
        const records = await (async () => {
            const db = getSupabaseClient();
            if (db) {
                const { data } = await db.from('guild_invites').select('*');
                return (data as InviteRecord[]) ?? [];
            }
            return jsonRead();
        })();

        const map = new Map<string, { total: number; accepted: number }>();
        for (const r of records) {
            const key = r.inviter.toLowerCase();
            const entry = map.get(key) ?? { total: 0, accepted: 0 };
            entry.total++;
            if (r.status === 'accepted') entry.accepted++;
            map.set(key, entry);
        }

        return Array.from(map.entries())
            .map(([inviter, stats]) => ({ inviter, ...stats }))
            .sort((a, b) => b.total - a.total);
    },
};
