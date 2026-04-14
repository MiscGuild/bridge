/**
 * Guild Rank Service
 *
 * Fetches and caches guild rank definitions from the Hypixel API.
 * Replaces all hardcoded rank name env vars (RANK_1–RANK_5).
 *
 * - Ranks are sorted by priority (ascending: 1 = lowest/member rank).
 * - "Guild Master" is the only hardcoded rank name (it's a Hypixel system rank
 *   not returned in the guild's `ranks` array).
 * - Staff = any rank above the default member rank (priority > lowest).
 * - Cooldown tiers (1–5) are assigned by distributing guild ranks evenly across
 *   the configured cooldown buckets. GM always gets COOLDOWN_LEADER (0).
 */

import { consola } from 'consola';
import env from '@/config/env';
import { hypixelService } from '@/services/hypixel';

export interface GuildRankDefinition {
    name: string;
    priority: number;
    default: boolean;
    tag?: string;
}

const GUILD_MASTER_NAME = 'Guild Master';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

class GuildRankService {
    private ranks: GuildRankDefinition[] = [];
    private minPriority = 1;
    private maxPriority = 1;
    private initialized = false;

    /** Cooldown seconds per tier (index 0 = lowest rank, 4 = highest non-GM) */
    private readonly tierCooldowns = [
        env.COOLDOWN_RANK_1, // tier 0 — member/default
        env.COOLDOWN_RANK_2,
        env.COOLDOWN_RANK_3,
        env.COOLDOWN_RANK_4,
        env.COOLDOWN_RANK_5, // tier 4 — highest non-GM rank
    ] as const;

    async init(guildName: string): Promise<void> {
        await this.fetchRanks(guildName);
        setInterval(() => this.fetchRanks(guildName).catch(() => {}), REFRESH_INTERVAL_MS);
        this.initialized = true;
    }

    private async fetchRanks(guildName: string): Promise<void> {
        try {
            // Use guild-by-name endpoint to get rank definitions
            const guild = await hypixelService.getGuildByName(guildName);
            if (!guild || !Array.isArray(guild.ranks) || guild.ranks.length === 0) {
                consola.warn('[GuildRanks] No ranks returned from Hypixel API — rank features degraded');
                return;
            }

            const sorted = [...guild.ranks].sort((a, b) => a.priority - b.priority);
            this.ranks = sorted;
            this.minPriority = sorted[0]!.priority;
            this.maxPriority = sorted[sorted.length - 1]!.priority;

            consola.info(`[GuildRanks] Loaded ${sorted.length} ranks: ${sorted.map(r => `${r.name}(${r.priority})`).join(', ')}`);
        } catch (err) {
            consola.warn('[GuildRanks] Failed to fetch guild ranks:', err);
        }
    }

    /**
     * Normalizes a guildRank string from chat (e.g. "[Officer]" → "Officer").
     */
    normalize(raw?: string): string {
        if (!raw) return '';
        return raw.replace(/[[\]]/g, '').trim();
    }

    /**
     * Returns true if the rank is a staff rank (above the lowest/member rank or is GM).
     */
    isStaffRank(guildRank?: string): boolean {
        const name = this.normalize(guildRank);
        if (!name) return false;
        if (name.toLowerCase() === 'guild master' || name.toLowerCase() === 'gm') return true;
        if (!this.initialized || this.ranks.length === 0) {
            // Fallback to legacy names if API hasn't loaded yet
            return ['leader', 'officer', 'mod', 'moderator'].includes(name.toLowerCase());
        }
        const rank = this.ranks.find(r => r.name.toLowerCase() === name.toLowerCase());
        // Staff = any rank above the default (lowest) member rank
        return rank ? rank.priority > this.minPriority : false;
    }

    /**
     * Returns the cooldown in seconds for the given guild rank.
     */
    getCooldownSeconds(guildRank?: string): number {
        const name = this.normalize(guildRank);
        if (!name) return env.COOLDOWN_RANK_1;

        if (name.toLowerCase() === 'guild master' || name.toLowerCase() === 'gm') {
            return env.COOLDOWN_LEADER;
        }

        if (!this.initialized || this.ranks.length === 0) {
            return env.COOLDOWN_RANK_1;
        }

        const rank = this.ranks.find(r => r.name.toLowerCase() === name.toLowerCase());
        if (!rank) return env.COOLDOWN_RANK_1;

        // Map rank priority to a tier index 0–4
        const tierIndex = this.priorityToTier(rank.priority);
        return this.tierCooldowns[tierIndex] ?? env.COOLDOWN_RANK_1;
    }

    /**
     * Maps a priority value to a 0-based tier index (0 = lowest, 4 = highest).
     */
    private priorityToTier(priority: number): number {
        if (this.maxPriority === this.minPriority) return 0;
        const normalized = (priority - this.minPriority) / (this.maxPriority - this.minPriority);
        return Math.min(4, Math.floor(normalized * 5));
    }

    /** Exposes loaded rank definitions (sorted ascending by priority). */
    getRanks(): GuildRankDefinition[] {
        return this.ranks;
    }

    get isReady(): boolean {
        return this.initialized && this.ranks.length > 0;
    }
}

export const guildRankService = new GuildRankService();
