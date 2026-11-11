import { readJson, updateJson } from '@/db/json-store';

export interface BlacklistRecord {
    id: string;
    uuid: string;
    username: string;
    reason: string;
    added_by: string;
    added_at: string;
    /** ISO date, or null for a permanent blacklist */
    expires_at: string | null;
    /** False once the entry is removed or has expired */
    is_active: boolean;
    /** The log message in BLACKLIST_CHANNEL_ID, edited when the entry expires or the player re-joins */
    discord_message_id: string | null;
}

export interface AddBlacklistInput {
    uuid: string;
    username: string;
    reason: string;
    added_by: string;
    expires_at: string | null;
}

const FILE = 'blacklist.json';

const load = () => readJson<BlacklistRecord[]>(FILE, []);

const update = <R>(mutate: (records: BlacklistRecord[]) => R) =>
    updateJson<BlacklistRecord[], R>(FILE, [], mutate);

function isExpired(record: BlacklistRecord, now = Date.now()): boolean {
    return record.expires_at !== null && new Date(record.expires_at).getTime() <= now;
}

/** Active and not past its expiry date. */
function isInForce(record: BlacklistRecord): boolean {
    return record.is_active && !isExpired(record);
}

function newId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * The guild blacklist, stored in data/blacklist.json with one record per player.
 * Removed and expired entries stay in the file with `is_active: false`.
 */
export const blacklistRepo = {
    /** Entries currently in force. */
    async getAll(): Promise<BlacklistRecord[]> {
        return (await load()).filter(isInForce);
    },

    /** The player's entry if they're currently blacklisted, otherwise null. */
    async getByUuid(uuid: string): Promise<BlacklistRecord | null> {
        return (await load()).find((r) => r.uuid === uuid && isInForce(r)) ?? null;
    },

    /** Blacklist a player. Blacklisting someone again replaces their previous entry. */
    async add(input: AddBlacklistInput): Promise<BlacklistRecord> {
        return update((records) => {
            for (let i = records.length - 1; i >= 0; i--) {
                if (records[i]!.uuid === input.uuid) records.splice(i, 1);
            }
            const record: BlacklistRecord = {
                id: newId(),
                ...input,
                added_at: new Date().toISOString(),
                is_active: true,
                discord_message_id: null,
            };
            records.push(record);
            return record;
        });
    },

    /** Lift a player's blacklist (permanent or not). */
    async remove(uuid: string): Promise<void> {
        await update((records) => {
            for (const r of records) {
                if (r.uuid === uuid) r.is_active = false;
            }
        });
    },

    /** Deactivate entries whose expiry date has passed, and return them for announcing. */
    async expireOverdue(): Promise<BlacklistRecord[]> {
        const now = Date.now();
        const isOverdue = (r: BlacklistRecord) => r.is_active && isExpired(r, now);
        // Skip the write in the usual case where nothing has expired
        if (!(await load()).some(isOverdue)) return [];

        return update((records) => {
            const expired = records.filter(isOverdue);
            for (const r of expired) r.is_active = false;
            return expired.map((r) => ({ ...r }));
        });
    },

    /** Push an entry's expiry back by `addMs`. Permanent entries are returned unchanged. */
    async extendExpiry(uuid: string, addMs: number): Promise<BlacklistRecord | null> {
        return update((records) => {
            const record = records.find((r) => r.uuid === uuid && r.is_active);
            if (!record) return null;
            if (record.expires_at !== null) {
                const base = Math.max(Date.now(), new Date(record.expires_at).getTime());
                record.expires_at = new Date(base + addMs).toISOString();
            }
            return { ...record };
        });
    },

    /** Remember the player's log message so it can be edited later. */
    async setDiscordMessageId(uuid: string, messageId: string): Promise<void> {
        await update((records) => {
            const record = records.find((r) => r.uuid === uuid && r.is_active);
            if (record) record.discord_message_id = messageId;
        });
    },
};
