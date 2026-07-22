import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';
import env from '@/config/env';
import { tournamentsRepo } from '@/db/repositories/tournaments.repo';
import { announceParticipantDq } from '@/modules/tournament/announce';
import {
    getPlayerTags,
    normalizeCoralTagType,
    type CoralTag,
} from '@/services/coral';
import type { TournamentRecord } from '@/modules/tournament/types';

/**
 * Coral / Urchin tag types that auto-DQ tournament participants.
 * Matched against normalized `tag_type` / mapped `type` (see coral.ts).
 * Exact after normalize — "possible sniper" / "legit sniper" do NOT match "sniper".
 */
export const TOURNAMENT_DQ_TAG_TYPES = [
    'caution',
    'closet cheater',
    'blatant cheater',
    'sniper',
] as const;

const DQ_TAG_SET = new Set<string>(TOURNAMENT_DQ_TAG_TYPES);

/** Tags among `tags` that trigger tournament auto-DQ. */
export function matchingDqTags(tags: CoralTag[]): CoralTag[] {
    return tags.filter((t) => DQ_TAG_SET.has(normalizeCoralTagType(t.type)));
}

export function formatDqTagTypes(tags: CoralTag[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of tags) {
        const n = normalizeCoralTagType(t.type);
        if (seen.has(n)) continue;
        seen.add(n);
        out.push(n);
    }
    return out;
}

export interface CoralDqResult {
    dqed: boolean;
    /** False when URCHIN_API_KEY missing or Coral lookup failed — no status change. */
    checked: boolean;
    tagTypes: string[];
}

/**
 * Check one participant against Coral DQ tags. If flagged and currently active,
 * set status to `disqualified` and announce (one embed).
 * Skips gracefully when `URCHIN_API_KEY` is unset or Coral returns null.
 */
export async function checkAndDqParticipant(
    bridge: Bridge,
    tournament: TournamentRecord,
    uuid: string,
    username: string,
    opts: { announce?: boolean } = {}
): Promise<CoralDqResult> {
    if (!env.URCHIN_API_KEY) {
        return { dqed: false, checked: false, tagTypes: [] };
    }

    const tags = await getPlayerTags(uuid);
    if (tags === null) {
        return { dqed: false, checked: false, tagTypes: [] };
    }

    const dqTags = matchingDqTags(tags);
    if (dqTags.length === 0) {
        return { dqed: false, checked: true, tagTypes: [] };
    }

    const tagTypes = formatDqTagTypes(dqTags);
    const participant = await tournamentsRepo.getParticipant(tournament.id, uuid);
    if (!participant) {
        return { dqed: false, checked: true, tagTypes };
    }
    if (participant.status === 'disqualified') {
        return { dqed: false, checked: true, tagTypes };
    }

    await tournamentsRepo.updateParticipantStatus(tournament.id, uuid, 'disqualified');
    await tournamentsRepo.closeOpenSegment(tournament.id, uuid).catch(() => null);

    consola.info(
        `[tournament] Coral DQ ${username} in ${tournament.name}: ${tagTypes.join(', ')}`
    );

    if (opts.announce !== false) {
        await announceParticipantDq(bridge, tournament, {
            username,
            uuid,
            tagTypes,
            reason: 'Coral auto-DQ',
        }).catch((err) => consola.warn('[tournament] DQ announce failed:', err));
    }

    return { dqed: true, checked: true, tagTypes };
}

/** Coral-check every active (non-DQ) participant in a tournament. */
export async function checkTournamentParticipantsCoral(
    bridge: Bridge,
    tournament: TournamentRecord
): Promise<{ checked: number; dqed: number }> {
    if (!env.URCHIN_API_KEY) return { checked: 0, dqed: 0 };

    const participants = await tournamentsRepo.listParticipants(tournament.id);
    let checked = 0;
    let dqed = 0;

    for (const p of participants) {
        if (p.status === 'disqualified') continue;
        const result = await checkAndDqParticipant(bridge, tournament, p.uuid, p.username);
        if (result.checked) checked++;
        if (result.dqed) dqed++;
        // Soft rate-limit Coral
        await new Promise((r) => setTimeout(r, 200));
    }

    return { checked, dqed };
}

/** Periodic job: Coral-check all active tournaments. */
export async function runCoralDqJob(bridge: Bridge): Promise<void> {
    if (!env.URCHIN_API_KEY) return;

    const active = await tournamentsRepo.getActive();
    for (const t of active) {
        try {
            const { checked, dqed } = await checkTournamentParticipantsCoral(bridge, t);
            if (dqed > 0) {
                consola.info(
                    `[tournament] Coral DQ job ${t.name}: ${dqed} DQ'd (${checked} checked)`
                );
            }
        } catch (err) {
            consola.error(`[tournament] Coral DQ job failed for ${t.id}:`, err);
        }
    }
}

/**
 * Staff manual DQ. Announces once. Idempotent if already DQ.
 */
export async function manualDisqualify(
    bridge: Bridge,
    tournament: TournamentRecord,
    uuid: string,
    username: string,
    reason = 'Staff DQ'
): Promise<{ changed: boolean }> {
    const participant = await tournamentsRepo.getParticipant(tournament.id, uuid);
    if (!participant) throw new Error(`${username} is not enrolled in this tournament.`);
    if (participant.status === 'disqualified') return { changed: false };

    await tournamentsRepo.updateParticipantStatus(tournament.id, uuid, 'disqualified');
    await tournamentsRepo.closeOpenSegment(tournament.id, uuid).catch(() => null);

    await announceParticipantDq(bridge, tournament, {
        username,
        uuid,
        tagTypes: [],
        reason,
    }).catch(() => {});

    return { changed: true };
}

/**
 * Staff undq — restore to `active` if they still have an open path (staff choice).
 * Does not clear Coral tags; a later Coral job may re-DQ if still flagged.
 */
export async function manualUndisqualify(
    tournament: TournamentRecord,
    uuid: string,
    username: string
): Promise<{ changed: boolean }> {
    const participant = await tournamentsRepo.getParticipant(tournament.id, uuid);
    if (!participant) throw new Error(`${username} is not enrolled in this tournament.`);
    if (participant.status !== 'disqualified') return { changed: false };

    await tournamentsRepo.updateParticipantStatus(tournament.id, uuid, 'active');
    await tournamentsRepo.openSegment(tournament.id, uuid).catch(() => null);
    return { changed: true };
}
