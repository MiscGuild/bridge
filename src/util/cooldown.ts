import type Bridge from '@/bridge/bridge';
import type { CommandContext } from '@/modules/types';
import { guildRankService } from '@/services/guild-ranks';

/** Per-player, per-command cooldowns. Lengths come from the player's guild rank (COOLDOWN_RANK_*). */
export class CooldownManager {
    /** `username:commandId` → time the cooldown ends */
    private store = new Map<string, number>();

    constructor() {
        setInterval(() => this.cleanup(), 60_000);
    }

    private key(username: string, commandId: string): string {
        return `${username.toLowerCase()}:${commandId}`;
    }

    /** Seconds left on the cooldown, or 0 if the command can be used. */
    isOnCooldown(username: string, commandId: string): number {
        const expiry = this.store.get(this.key(username, commandId));
        if (!expiry) return 0;
        return Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
    }

    setCooldown(username: string, commandId: string, guildRank?: string): void {
        const secs = guildRankService.getCooldownSeconds(guildRank);
        if (secs === 0) return;
        this.store.set(this.key(username, commandId), Date.now() + secs * 1000);
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, expiry] of this.store) {
            if (expiry <= now) this.store.delete(key);
        }
    }
}

const cooldowns = new CooldownManager();
export default cooldowns;

/**
 * If the sender is on cooldown for `commandId`, tell them in chat and return true.
 * `suffix` is appended to the reply.
 */
export function replyIfOnCooldown(
    ctx: CommandContext,
    bridge: Bridge,
    commandId: string,
    suffix = ''
): boolean {
    const remaining = cooldowns.isOnCooldown(ctx.username, commandId);
    if (remaining === 0) return false;
    bridge.bot.chat(ctx.replyChannel, `${ctx.username}, cooldown: ${remaining}s${suffix}`);
    return true;
}
