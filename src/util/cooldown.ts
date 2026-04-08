import env from '@/config/env';

interface CooldownEntry {
    expiry: number;
}

type CommandId = string;
type Username = string;

export class CooldownManager {
    private store = new Map<string, CooldownEntry>();
    private readonly cooldowns: Record<string, number>;

    constructor() {
        this.cooldowns = {
            [env.RANK_1]: env.COOLDOWN_RANK_1,
            [env.RANK_2]: env.COOLDOWN_RANK_2,
            [env.RANK_3]: env.COOLDOWN_RANK_3,
            [env.RANK_4]: env.COOLDOWN_RANK_4,
            [env.RANK_5]: env.COOLDOWN_RANK_5,
            [env.RANK_LEADER]: env.COOLDOWN_LEADER,
            urchin: env.COOLDOWN_URCHIN,
        };

        // Clean up expired entries every 60 seconds
        setInterval(() => this.cleanup(), 60_000);
    }

    private key(username: Username, commandId: CommandId): string {
        return `${username.toLowerCase()}:${commandId}`;
    }

    private normRank(raw?: string): string {
        if (!raw) return '';
        return raw.replace(/[\[\]]/g, '').trim();
    }

    getCooldownSeconds(guildRank?: string): number {
        const rank = this.normRank(guildRank);
        for (const [name, secs] of Object.entries(this.cooldowns)) {
            if (name && name.toLowerCase() === rank.toLowerCase()) return secs;
        }
        return env.COOLDOWN_RANK_1;
    }

    /** Returns remaining seconds if on cooldown, 0 if free */
    isOnCooldown(username: Username, guildRank: string | undefined, commandId: CommandId): number {
        const entry = this.store.get(this.key(username, commandId));
        if (!entry) return 0;
        const remaining = Math.ceil((entry.expiry - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
    }

    setCooldown(username: Username, commandId: CommandId, guildRank?: string): void {
        const secs = this.getCooldownSeconds(guildRank);
        if (secs === 0) return;
        this.store.set(this.key(username, commandId), { expiry: Date.now() + secs * 1000 });
    }

    clearCooldown(username: Username, commandId: CommandId): void {
        this.store.delete(this.key(username, commandId));
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [k, v] of this.store) {
            if (v.expiry <= now) this.store.delete(k);
        }
    }
}

export default new CooldownManager();
