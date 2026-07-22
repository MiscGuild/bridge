import { consola } from 'consola';
import env from '@/config/env';
import { CORAL_API_BASE } from '@/config/constants';

/** Stable internal tag shape (mapped from Coral `tag_type` / `type`). */
export interface CoralTag {
    type: string;
    reason?: string;
}

interface CoralTagRaw {
    /** Coral v3 `/v3/player/tags` field */
    tag_type?: string;
    /** Older Urchin docs field */
    type?: string;
    reason?: string;
}

interface CoralPlayerTagsResponse {
    uuid: string;
    tags: CoralTagRaw[];
    displayname?: string | null;
}

const USER_AGENT = 'MiscellaneousBridge/3.0 (info@vliegenier04.dev)';

/**
 * Normalize Coral tag labels for comparison:
 * trim, lower-case, collapse `_`/`-`/whitespace → single spaces.
 * e.g. "Closet_Cheater" / "Closet Cheater" → "closet cheater"
 */
export function normalizeCoralTagType(tag: string): string {
    return tag
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ');
}

function mapTags(raw: CoralTagRaw[] | undefined): CoralTag[] {
    if (!raw || raw.length === 0) return [];
    return raw
        .map((t) => ({
            type: t.tag_type ?? t.type ?? '',
            reason: t.reason,
        }))
        .filter((t) => t.type.length > 0);
}

/**
 * Fetch active Coral (Urchin) blacklist tags for a player.
 * Uses `GET /v3/player/tags?player=…` with `X-API-Key` from `URCHIN_API_KEY`.
 *
 * Returns:
 * - `CoralTag[]` on success (may be empty)
 * - `null` when the API key is missing, or on auth/rate-limit/HTTP/network errors
 */
export async function getPlayerTags(player: string): Promise<CoralTag[] | null> {
    const apiKey = env.URCHIN_API_KEY;
    if (!apiKey) return null;

    const url = new URL(`${CORAL_API_BASE}/v3/player/tags`);
    url.searchParams.set('player', player);

    try {
        const res = await fetch(url, {
            headers: {
                'X-API-Key': apiKey,
                Accept: 'application/json',
                'User-Agent': USER_AGENT,
            },
        });

        if (res.status === 404) return [];
        if (res.status === 401 || res.status === 403) {
            consola.warn('[Coral] API key rejected');
            return null;
        }
        if (res.status === 429) {
            consola.warn('[Coral] Rate limited');
            return null;
        }
        if (!res.ok) {
            consola.warn(`[Coral] Unexpected status ${res.status}`);
            return null;
        }

        const data = (await res.json()) as CoralPlayerTagsResponse;
        return mapTags(data.tags);
    } catch (err) {
        consola.warn('[Coral] Request failed:', err);
        return null;
    }
}

/** True when the player has one or more Coral tags. False on empty tags or lookup failure. */
export async function isFlagged(player: string): Promise<boolean> {
    const tags = await getPlayerTags(player);
    return !!tags && tags.length > 0;
}

/** Tag type strings only; empty array on missing key / error / no tags. */
export async function getTagTypes(player: string): Promise<string[]> {
    const tags = await getPlayerTags(player);
    return tags?.map((t) => t.type) ?? [];
}
