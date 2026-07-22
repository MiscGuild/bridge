import { consola } from 'consola';
import { tournamentsRepo } from '@/db/repositories/tournaments.repo';
import { gexpHistoryRepo } from '@/db/repositories/gexp-history.repo';
import { hypixelService } from '@/services/hypixel';
import { mojangService } from '@/services/mojang';
import { extractTournamentStats } from '@/modules/tournament/metrics';
import { emptyStats, type TournamentStats } from '@/modules/tournament/types';

function normalizeUuid(uuid: string): string {
    return uuid.replace(/-/g, '').toLowerCase();
}

/** Fetch current tournament stats for one player (Hypixel + cumulative GEXP). */
export async function fetchPlayerTournamentStats(uuid: string): Promise<TournamentStats | null> {
    const norm = normalizeUuid(uuid);
    hypixelService.clearCache(norm);
    const player = await hypixelService.getPlayer(norm);
    if (!player) return null;

    let gexp = await gexpHistoryRepo.getLifetimeTotal(norm).catch(() => 0);
    // Fallback: sum current Hypixel 7-day expHistory if we have no local GEXP yet
    if (gexp === 0) {
        try {
            const guild = await hypixelService.getGuild(norm);
            const member = guild?.members.find((m) => normalizeUuid(m.uuid) === norm);
            if (member?.expHistory) {
                gexp = Object.values(member.expHistory).reduce((a, b) => a + b, 0);
            }
        } catch {
            /* ignore */
        }
    }

    return extractTournamentStats(player, gexp);
}

export interface SnapshotMemberInput {
    uuid: string;
    username?: string;
}

/**
 * Snapshot one member: write snapshot row; optionally upsert participant + open segment.
 */
export async function snapshotMember(
    tournamentId: string,
    member: SnapshotMemberInput,
    opts: { enroll?: boolean; openSegment?: boolean } = {}
): Promise<{ uuid: string; username: string; stats: TournamentStats } | null> {
    const uuid = normalizeUuid(member.uuid);
    let username = member.username;
    if (!username) {
        const profile = await mojangService.getByUuid(uuid).catch(() => null);
        username = profile?.name ?? `Unknown-${uuid.slice(0, 8)}`;
    }

    const stats = await fetchPlayerTournamentStats(uuid);
    if (!stats) {
        consola.warn(`[tournament] failed to fetch stats for ${username} (${uuid})`);
        return null;
    }

    // Phase 5: merge persisted qualifying_logins into snapshot stats
    const existing = await tournamentsRepo.getParticipant(tournamentId, uuid);
    stats.qualifying_logins = existing?.qualifying_logins ?? 0;

    await tournamentsRepo.addSnapshot(tournamentId, uuid, stats);

    if (opts.enroll) {
        await tournamentsRepo.upsertParticipant({
            tournament_id: tournamentId,
            uuid,
            username,
            baseline_stats: stats,
            status: 'active',
        });
    }

    if (opts.openSegment) {
        await tournamentsRepo.openSegment(tournamentId, uuid);
    }

    return { uuid, username, stats };
}

/**
 * Write a snapshot after a qualifying-login credit (Phase 5).
 * Prefers a fresh Hypixel pull; falls back to bumping the latest snapshot's stats.
 */
export async function snapshotWithQualifyingLogins(
    tournamentId: string,
    uuid: string,
    username: string,
    qualifyingLogins: number
): Promise<void> {
    const norm = normalizeUuid(uuid);
    const stats = await fetchPlayerTournamentStats(norm);
    if (stats) {
        stats.qualifying_logins = qualifyingLogins;
        await tournamentsRepo.addSnapshot(tournamentId, norm, stats);
        return;
    }

    const latest = await tournamentsRepo.getLatestSnapshot(tournamentId, norm);
    if (latest) {
        const bumped = { ...latest.stats, qualifying_logins: qualifyingLogins };
        await tournamentsRepo.addSnapshot(tournamentId, norm, bumped);
        return;
    }

    // No prior snapshot — minimal stats row so the login delta is still recorded
    const minimal = emptyStats();
    minimal.qualifying_logins = qualifyingLogins;
    await tournamentsRepo.addSnapshot(tournamentId, norm, minimal);
    consola.warn(
        `[tournament] login snapshot for ${username} used minimal stats (Hypixel unavailable)`
    );
}

/** Enroll + baseline-snapshot all current guild members for tournament start. */
export async function snapshotGuildForStart(
    tournamentId: string,
    members: SnapshotMemberInput[]
): Promise<{ enrolled: number; failed: number }> {
    let enrolled = 0;
    let failed = 0;

    for (const member of members) {
        const result = await snapshotMember(tournamentId, member, {
            enroll: true,
            openSegment: true,
        });
        if (result) enrolled++;
        else failed++;
        // Soft rate-limit Hypixel / Mojang
        await new Promise((r) => setTimeout(r, 150));
    }

    consola.info(
        `[tournament] start snapshot complete for ${tournamentId}: ${enrolled} enrolled, ${failed} failed`
    );
    return { enrolled, failed };
}

/** Periodic resnapshot of all active (in-guild) participants. */
export async function resnapshotActiveTournament(tournamentId: string): Promise<number> {
    const participants = await tournamentsRepo.listParticipants(tournamentId);
    const active = participants.filter((p) => p.status === 'active');
    let count = 0;

    for (const p of active) {
        const stats = await fetchPlayerTournamentStats(p.uuid);
        if (!stats) continue;
        stats.qualifying_logins = p.qualifying_logins ?? 0;
        await tournamentsRepo.addSnapshot(tournamentId, p.uuid, stats);
        count++;
        await new Promise((r) => setTimeout(r, 150));
    }

    consola.info(`[tournament] resnapshot ${tournamentId}: ${count}/${active.length} players`);
    return count;
}

/** Resnapshot every active tournament (scheduler entrypoint). */
export async function resnapshotAllActive(): Promise<void> {
    const active = await tournamentsRepo.getActive();
    for (const t of active) {
        await resnapshotActiveTournament(t.id).catch((err) =>
            consola.error(`[tournament] resnapshot failed for ${t.id}:`, err)
        );
    }
}
