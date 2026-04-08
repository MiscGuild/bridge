/**
 * Centralized Cooldown Manager
 *
 * Manages command cooldowns based on guild ranks configured via environment variables.
 * Provides a consistent cooldown system across all extensions.
 *
 * @author MiscGuild Bridge Bot Team
 * @version 1.0.0
 */

import env from './env';

interface CooldownEntry {
    timestamp: number;
    username: string;
}

export class CooldownManager {
    private cooldowns: Map<string, CooldownEntry> = new Map();
    private rankCooldowns: Map<string, number> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.loadRankCooldowns();
        this.startCleanup();
    }

    /**
     * Load cooldown times for each rank from environment variables
     */
    private loadRankCooldowns(): void {
        // Load ranks (RANK_1 is lowest, RANK_LEADER is highest)
        this.rankCooldowns.set(env.RANK_1, env.COOLDOWN_RANK_1);
        this.rankCooldowns.set(env.RANK_2, env.COOLDOWN_RANK_2);
        this.rankCooldowns.set(env.RANK_3, env.COOLDOWN_RANK_3);
        this.rankCooldowns.set(env.RANK_4, env.COOLDOWN_RANK_4);
        this.rankCooldowns.set(env.RANK_5, env.COOLDOWN_RANK_5);
        this.rankCooldowns.set(env.RANK_LEADER, env.COOLDOWN_LEADER);

        // Add common variations with brackets
        this.rankCooldowns.set(`[${env.RANK_1}]`, env.COOLDOWN_RANK_1);
        this.rankCooldowns.set(`[${env.RANK_2}]`, env.COOLDOWN_RANK_2);
        this.rankCooldowns.set(`[${env.RANK_3}]`, env.COOLDOWN_RANK_3);
        this.rankCooldowns.set(`[${env.RANK_4}]`, env.COOLDOWN_RANK_4);
        this.rankCooldowns.set(`[${env.RANK_5}]`, env.COOLDOWN_RANK_5);
        this.rankCooldowns.set(`[${env.RANK_LEADER}]`, env.COOLDOWN_LEADER);

        console.log(
            'Cooldown Manager initialized with ranks:',
            Array.from(this.rankCooldowns.entries())
        );
    }

    /**
     * Get cooldown duration for a specific rank
     */
    public getCooldownForRank(guildRank?: string): number {
        if (!guildRank) {
            return env.COOLDOWN_RANK_1; // Default to rank 1 (lowest rank) cooldown
        }

        // Try exact match
        if (this.rankCooldowns.has(guildRank)) {
            return this.rankCooldowns.get(guildRank)!;
        }

        // Try without brackets
        const rankWithoutBrackets = guildRank.replace(/[[\]]/g, '');
        if (this.rankCooldowns.has(rankWithoutBrackets)) {
            return this.rankCooldowns.get(rankWithoutBrackets)!;
        }

        // Try with brackets
        const rankWithBrackets = `[${rankWithoutBrackets}]`;
        if (this.rankCooldowns.has(rankWithBrackets)) {
            return this.rankCooldowns.get(rankWithBrackets)!;
        }

        // Default to rank 1 cooldown if rank not found
        console.warn(`Unknown guild rank "${guildRank}", using default rank 1 cooldown`);
        return env.COOLDOWN_RANK_1;
    }

    /**
     * Check if a user is on cooldown
     * @returns Number of seconds remaining, or null if not on cooldown
     */
    public isOnCooldown(username: string, guildRank?: string, commandId?: string): number | null {
        const key = commandId ? `${username}-${commandId}` : username;
        const entry = this.cooldowns.get(key);

        if (!entry) {
            return null; // No cooldown
        }

        const cooldownDuration = this.getCooldownForRank(guildRank);
        const cooldownMs = cooldownDuration * 1000;
        const elapsed = Date.now() - entry.timestamp;

        if (elapsed >= cooldownMs) {
            // Cooldown expired, remove it
            this.cooldowns.delete(key);
            return null;
        }

        // Return remaining seconds
        return Math.ceil((cooldownMs - elapsed) / 1000);
    }

    /**
     * Set a cooldown for a user
     */
    public setCooldown(username: string, commandId?: string): void {
        const key = commandId ? `${username}-${commandId}` : username;
        this.cooldowns.set(key, {
            timestamp: Date.now(),
            username,
        });
    }

    /**
     * Clear cooldown for a user (admin override)
     */
    public clearCooldown(username: string, commandId?: string): void {
        const key = commandId ? `${username}-${commandId}` : username;
        this.cooldowns.delete(key);
    }

    /**
     * Clear all cooldowns (admin function)
     */
    public clearAllCooldowns(): void {
        this.cooldowns.clear();
    }

    /**
     * Get all active cooldowns (for debugging)
     */
    public getActiveCooldowns(): Array<{ username: string; key: string; expiresIn: number }> {
        const now = Date.now();
        const active: Array<{ username: string; key: string; expiresIn: number }> = [];

        this.cooldowns.forEach((entry, key) => {
            const expiresIn = Math.ceil((entry.timestamp + 60000 - now) / 1000); // Assuming 60s default
            if (expiresIn > 0) {
                active.push({
                    username: entry.username,
                    key,
                    expiresIn,
                });
            }
        });

        return active;
    }

    /**
     * Start periodic cleanup of expired cooldowns
     */
    private startCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            const maxCooldown = Math.max(...Array.from(this.rankCooldowns.values())) * 1000;
            let removed = 0;

            this.cooldowns.forEach((entry, key) => {
                if (now - entry.timestamp > maxCooldown) {
                    this.cooldowns.delete(key);
                    removed++;
                }
            });

            if (removed > 0) {
                console.debug(`Cleaned up ${removed} expired cooldowns`);
            }
        }, 60000); // Clean every minute
    }

    /**
     * Stop cleanup interval (call on shutdown)
     */
    public destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.cooldowns.clear();
    }

    /**
     * Get cooldown configuration for display
     */
    public getCooldownConfig(): Map<string, number> {
        return new Map(this.rankCooldowns);
    }
}

// Export singleton instance
export const cooldownManager = new CooldownManager();

export default cooldownManager;
