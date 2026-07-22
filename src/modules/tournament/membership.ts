import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';
import { tournamentsRepo } from '@/db/repositories/tournaments.repo';
import { checkAndDqParticipant } from '@/modules/tournament/coral-dq';
import { onGuildMembershipLeft } from '@/modules/tournament/presence';
import { snapshotMember } from '@/modules/tournament/snapshots';

/**
 * Membership segment hooks for leave/rejoin during an active tournament.
 * Foundation for "only count progress while in guild".
 *
 * Phase 4: Coral auto-DQ on join/enroll (skipped gracefully without URCHIN_API_KEY).
 * Phase 5: guild leave closes guild-chat presence streak.
 */
export async function onGuildMemberJoined(
    uuid: string,
    username: string,
    bridge?: Bridge
): Promise<void> {
    const active = await tournamentsRepo.getActive();
    if (active.length === 0) return;

    for (const t of active) {
        try {
            const existing = await tournamentsRepo.getParticipant(t.id, uuid);
            if (existing?.status === 'disqualified') {
                // Manual / Coral DQ persists across rejoin until staff /tournament undq
                consola.info(
                    `[tournament] ${username} rejoined but remains DQ in ${t.name}`
                );
                continue;
            }

            if (existing) {
                // Rejoin: mark active again, open new segment, snapshot as segment baseline
                await tournamentsRepo.updateParticipantStatus(t.id, uuid, 'active');
                await snapshotMember(t.id, { uuid, username }, { openSegment: true });
            } else {
                // Late join during tournament — auto-enroll from this point
                await snapshotMember(
                    t.id,
                    { uuid, username },
                    { enroll: true, openSegment: true }
                );
            }

            // Phase 4: Coral check on enroll / rejoin (channel announce if DQ)
            if (bridge) {
                await checkAndDqParticipant(bridge, t, uuid, username);
            }

            consola.info(`[tournament] ${username} joined active tournament ${t.name}`);
        } catch (err) {
            consola.error(`[tournament] join hook failed for ${username}:`, err);
        }
    }
}

export async function onGuildMemberLeft(uuid: string, username: string): Promise<void> {
    // Phase 5: leaving the guild closes any open guild-chat presence streak
    await onGuildMembershipLeft(uuid).catch((err) =>
        consola.warn(`[tournament] presence close on guild leave failed:`, err)
    );

    const active = await tournamentsRepo.getActive();
    if (active.length === 0) return;

    for (const t of active) {
        try {
            const existing = await tournamentsRepo.getParticipant(t.id, uuid);
            if (!existing || existing.status === 'disqualified') continue;

            // Snapshot at leave boundary, then close open segment
            await snapshotMember(t.id, { uuid, username });
            await tournamentsRepo.closeOpenSegment(t.id, uuid);
            await tournamentsRepo.updateParticipantStatus(t.id, uuid, 'left');
            consola.info(`[tournament] ${username} left active tournament ${t.name}`);
        } catch (err) {
            consola.error(`[tournament] leave hook failed for ${username}:`, err);
        }
    }
}
