import env from '@/config/env';
import { guildRankService } from '@/services/guild-ranks';

interface CooldownEntry {
    expiry: number;
}

type CommandId = string;
type Username = string;

export class CooldownManager {
    private store = new Map<string, CooldownEntry>();

    constructor() {
        // Clean up expired entries every 60 seconds
        setInterval(() => this.cleanup(), 60_000);
    }

    private key(username: Username, commandId: CommandId): string {
        return `${username.toLowerCase()}:${commandId}`;
    }

    getCooldownSeconds(guildRank?: string): number {
        return guildRankService.getCooldownSeconds(guildRank);
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

// Keep COOLDOWN_URCHIN as a direct env read (urchin is not a guild rank)
export const URCHIN_COOLDOWN = env.COOLDOWN_URCHIN;

export default new CooldownManager();
