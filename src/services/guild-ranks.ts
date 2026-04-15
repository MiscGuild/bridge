/**
 * Guild Rank Service
 *
 * Primary: fetches rank definitions from the Hypixel API (name + tag + priority).
 * Fallback: reads RANK_1_NAME/RANK_1_TAG … RANK_5_NAME/RANK_5_TAG from .env.
 *
 * Chat messages show the rank TAG (e.g. [Admin], [Sent]) not the name (Architect, Sentinel).
 * Both name and tag are matched when looking up a rank.
 *
 * Guild Master is always hardcoded (Hypixel system rank, not in the API response).
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

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

class GuildRankService {
    private ranks: GuildRankDefinition[] = [];
    private minPriority = 1;
    private maxPriority = 1;
    private apiLoaded = false;

    /** Cooldown seconds per tier (index 0 = lowest rank, 4 = highest non-GM) */
    private readonly tierCooldowns = [
        env.COOLDOWN_RANK_1,
        env.COOLDOWN_RANK_2,
        env.COOLDOWN_RANK_3,
        env.COOLDOWN_RANK_4,
        env.COOLDOWN_RANK_5,
    ] as const;

    /** Fallback rank definitions from .env (used when API hasn't loaded) */
    private readonly envRanks: { name: string; tag: string; tier: number }[];

    constructor() {
        // Build env fallback list (tier 1 = lowest, 5 = highest non-GM)
        this.envRanks = [
            { name: env.RANK_1_NAME, tag: env.RANK_1_TAG, tier: 0 },
            { name: env.RANK_2_NAME, tag: env.RANK_2_TAG, tier: 1 },
            { name: env.RANK_3_NAME, tag: env.RANK_3_TAG, tier: 2 },
            { name: env.RANK_4_NAME, tag: env.RANK_4_TAG, tier: 3 },
            { name: env.RANK_5_NAME, tag: env.RANK_5_TAG, tier: 4 },
        ].filter((r) => r.name || r.tag);
    }

    async init(guildName: string): Promise<void> {
        await this.fetchRanks(guildName);
        setInterval(() => this.fetchRanks(guildName).catch(() => {}), REFRESH_INTERVAL_MS);
    }

    private async fetchRanks(guildName: string): Promise<void> {
        try {
            const guild = await hypixelService.getGuildByName(guildName);
            if (!guild || !Array.isArray(guild.ranks) || guild.ranks.length === 0) {
                consola.warn('[GuildRanks] No ranks from API — using .env fallback');
                return;
            }

            const sorted = [...guild.ranks].sort((a, b) => a.priority - b.priority);
            this.ranks = sorted;
            this.minPriority = sorted[0]!.priority;
            this.maxPriority = sorted[sorted.length - 1]!.priority;
            this.apiLoaded = true;

            consola.info(
                `[GuildRanks] Loaded ${sorted.length} ranks: ${sorted
                    .map((r) => `${r.name}${r.tag ? `[${r.tag}]` : ''}(${r.priority})`)
                    .join(', ')}`
            );
        } catch (err) {
            consola.warn('[GuildRanks] Failed to fetch guild ranks:', err);
        }
    }

    /** Strips brackets and trims: "[Admin]" → "Admin" */
    normalize(raw?: string): string {
        if (!raw) return '';
        return raw.replace(/[[\]]/g, '').trim();
    }

    /**
     * Find a rank by matching name OR tag (case-insensitive).
     * If API loaded, searches API ranks. Otherwise searches .env fallback.
     */
    private findApiRank(normalized: string): GuildRankDefinition | undefined {
        const lower = normalized.toLowerCase();
        return this.ranks.find(
            (r) => r.name.toLowerCase() === lower || (r.tag && r.tag.toLowerCase() === lower)
        );
    }

    private findEnvRank(normalized: string): { tier: number } | undefined {
        const lower = normalized.toLowerCase();
        return this.envRanks.find(
            (r) =>
                (r.name && r.name.toLowerCase() === lower) ||
                (r.tag && r.tag.toLowerCase() === lower)
        );
    }

    /** Returns true if the rank is a staff rank (above the lowest/member rank or is GM). */
    isStaffRank(guildRank?: string): boolean {
        const name = this.normalize(guildRank);
        if (!name) return false;

        const lower = name.toLowerCase();
        if (
            lower === 'guild master' ||
            lower === 'gm' ||
            lower === env.RANK_LEADER_TAG.toLowerCase()
        ) {
            return true;
        }

        if (this.apiLoaded) {
            const rank = this.findApiRank(name);
            return rank ? rank.priority > this.minPriority : false;
        }

        // Env fallback: tier > 0 means above lowest rank = staff
        const envRank = this.findEnvRank(name);
        if (envRank) return envRank.tier > 0;

        // Last resort hardcoded names
        return ['leader', 'officer', 'mod', 'moderator', 'admin'].includes(lower);
    }

    /** Returns the cooldown in seconds for the given guild rank. */
    getCooldownSeconds(guildRank?: string): number {
        const name = this.normalize(guildRank);
        if (!name) return env.COOLDOWN_RANK_1;

        const lower = name.toLowerCase();
        if (
            lower === 'guild master' ||
            lower === 'gm' ||
            lower === env.RANK_LEADER_TAG.toLowerCase()
        ) {
            return env.COOLDOWN_LEADER;
        }

        if (this.apiLoaded) {
            const rank = this.findApiRank(name);
            if (!rank) return env.COOLDOWN_RANK_1;
            const tierIndex = this.priorityToTier(rank.priority);
            return this.tierCooldowns[tierIndex] ?? env.COOLDOWN_RANK_1;
        }

        // Env fallback
        const envRank = this.findEnvRank(name);
        return envRank
            ? (this.tierCooldowns[envRank.tier] ?? env.COOLDOWN_RANK_1)
            : env.COOLDOWN_RANK_1;
    }

    /** Maps a priority value to a 0-based tier index (0 = lowest, 4 = highest). */
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
        return this.apiLoaded && this.ranks.length > 0;
    }
}

export const guildRankService = new GuildRankService();
