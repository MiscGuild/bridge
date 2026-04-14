import { consola } from 'consola';
import NodeCache from 'node-cache';
import env from '@/config/env';
import { HYPIXEL_API_BASE, HYPIXEL_API_V2_BASE, STATS_CACHE_TTL_MS } from '@/config/constants';

const cache = new NodeCache({ stdTTL: STATS_CACHE_TTL_MS / 1000 });
const inFlight = new Map<string, Promise<unknown>>();

function getApiKeys(): string[] {
    return [
        env.HYPIXEL_API_KEY,
        env.FALLBACK_HYPIXEL_API_KEY,
    ].filter((k): k is string => Boolean(k));
}

let keyIndex = 0;
function nextKey(): string {
    const keys = getApiKeys();
    if (keys.length === 0) throw new Error('No Hypixel API keys configured');
    const key = keys[keyIndex % keys.length]!;
    keyIndex = (keyIndex + 1) % keys.length;
    return key;
}

async function fetchWithRetry(url: string, retries = 3): Promise<unknown> {
    let lastError: unknown;
    for (let attempt = 0; attempt < retries; attempt++) {
        const key = nextKey();
        const separator = url.includes('?') ? '&' : '?';
        const fullUrl = `${url}${separator}key=${key}`;

        try {
            const res = await fetch(fullUrl);

            if (res.status === 429) {
                const delay = Math.pow(2, attempt) * 1000;
                consola.warn(`Hypixel rate limited, retrying in ${delay}ms (attempt ${attempt + 1})`);
                await new Promise((r) => setTimeout(r, delay));
                continue;
            }

            if (!res.ok) {
                throw Object.assign(new Error(`HTTP ${res.status}: ${res.statusText}`), {
                    status: res.status,
                });
            }

            return await res.json();
        } catch (err) {
            lastError = err;
            if (attempt < retries - 1) {
                const delay = Math.pow(2, attempt) * 500;
                await new Promise((r) => setTimeout(r, delay));
            }
        }
    }
    throw lastError;
}

async function cachedFetch<T>(cacheKey: string, url: string): Promise<T> {
    const cached = cache.get<T>(cacheKey);
    if (cached !== undefined) return cached;

    const existing = inFlight.get(cacheKey);
    if (existing) return existing as Promise<T>;

    const promise = fetchWithRetry(url).then((data) => {
        cache.set(cacheKey, data);
        inFlight.delete(cacheKey);
        return data as T;
    }).catch((err) => {
        inFlight.delete(cacheKey);
        throw err;
    });

    inFlight.set(cacheKey, promise);
    return promise;
}

export const hypixelService = {
    async getPlayer(uuid: string): Promise<HypixelPlayerResponse | null> {
        try {
            const data = await cachedFetch<{ player: HypixelPlayerResponse }>(
                `player:${uuid}`,
                `${HYPIXEL_API_BASE}/player?uuid=${uuid}`
            );
            return data.player ?? null;
        } catch {
            return null;
        }
    },

    async getGuild(playerUuid: string): Promise<HypixelGuildResponse | null> {
        try {
            const data = await cachedFetch<{ guild: HypixelGuildResponse }>(
                `guild:${playerUuid}`,
                `${HYPIXEL_API_BASE}/guild?player=${playerUuid}`
            );
            return data.guild ?? null;
        } catch {
            return null;
        }
    },

    async getSkyblockProfiles(uuid: string): Promise<unknown[]> {
        try {
            const data = await cachedFetch<{ profiles: unknown[] | null }>(
                `skyblock:${uuid}`,
                `${HYPIXEL_API_V2_BASE}/skyblock/profiles?uuid=${uuid}`
            );
            if (!data.profiles) {
                consola.debug(`[SkyBlock] No profiles returned for UUID ${uuid}`);
                return [];
            }
            return data.profiles;
        } catch (err) {
            consola.warn(`[SkyBlock] Failed to fetch profiles for UUID ${uuid}:`, err);
            return [];
        }
    },

    clearCache(uuid?: string) {
        if (uuid) {
            cache.del(`player:${uuid}`);
            cache.del(`guild:${uuid}`);
            cache.del(`skyblock:${uuid}`);
        } else {
            cache.flushAll();
        }
    },
};

// Types
export interface HypixelPlayerResponse {
    uuid: string;
    displayname: string;
    rank?: string;
    packageRank?: string;
    newPackageRank?: string;
    networkExp?: number;
    networkLevel?: number;
    stats?: Record<string, unknown>;
    achievements?: Record<string, number>;
    lastLogin?: number;
    lastLogout?: number;
}

export interface HypixelGuildResponse {
    _id: string;
    name: string;
    coins: number;
    coinsEver: number;
    created: number;
    members: HypixelGuildMember[];
    tag?: string;
    tagColor?: string;
    exp?: number;
    guildExpByGameType?: Record<string, number>;
}

export interface HypixelGuildMember {
    uuid: string;
    rank: string;
    joined: number;
    expHistory: Record<string, number>;
}
