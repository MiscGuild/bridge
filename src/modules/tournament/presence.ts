import { consola } from 'consola';
import { tournamentsRepo } from '@/db/repositories/tournaments.repo';
import { snapshotWithQualifyingLogins } from '@/modules/tournament/snapshots';
import { mojangService } from '@/services/mojang';

/** Continuous guild-chat online minutes required for +1 qualifying login (locked spec). */
export const QUALIFYING_LOGIN_MINUTES = 15;
const QUALIFYING_LOGIN_MS = QUALIFYING_LOGIN_MINUTES * 60 * 1000;

function normalizeUuid(uuid: string): string {
    return uuid.replace(/-/g, '').toLowerCase();
}

/**
 * Player joined Hypixel while in the guild (`Guild > X joined.`).
 * Starts a continuous online streak for qualifying-login credit.
 */
export async function onPlayerOnline(playerName: string): Promise<void> {
    const profile = await mojangService.getProfile(playerName).catch(() => null);
    if (!profile) {
        consola.debug(`[tournament] presence join: unresolved ${playerName}`);
        return;
    }
    await tournamentsRepo.openPresenceSession(profile.id, profile.name);
}

/**
 * Player left Hypixel / went offline (`Guild > X left.`).
 * Closes streak; awards +1 only if continuous duration ≥ 15m and not yet credited.
 */
export async function onPlayerOffline(playerName: string): Promise<void> {
    const profile = await mojangService.getProfile(playerName).catch(() => null);
    if (!profile) {
        consola.debug(`[tournament] presence leave: unresolved ${playerName}`);
        return;
    }
    await closePresenceAndMaybeCredit(profile.id);
}

/**
 * Guild membership leave/kick — close any open guild-chat presence streak.
 */
export async function onGuildMembershipLeft(uuid: string): Promise<void> {
    await closePresenceAndMaybeCredit(normalizeUuid(uuid));
}

async function closePresenceAndMaybeCredit(uuid: string): Promise<void> {
    const session = await tournamentsRepo.getOpenPresenceSession(uuid);
    if (!session) return;

    const durationMs = Date.now() - new Date(session.joined_at).getTime();
    const shouldCredit = !session.credited && durationMs >= QUALIFYING_LOGIN_MS;

    if (shouldCredit) {
        await creditQualifyingLogin(uuid, session.username);
    }

    await tournamentsRepo.closePresenceSession(uuid);
}

/**
 * Periodic tick: credit open sessions that have reached ≥15m while still online.
 * One credit per continuous streak (session.credited flag).
 */
export async function runPresenceCreditJob(): Promise<void> {
    const open = await tournamentsRepo.listOpenPresenceSessions();
    const now = Date.now();

    for (const session of open) {
        if (session.credited) continue;
        const durationMs = now - new Date(session.joined_at).getTime();
        if (durationMs < QUALIFYING_LOGIN_MS) continue;

        await creditQualifyingLogin(session.uuid, session.username);
        await tournamentsRepo.markPresenceCredited(session.uuid);
    }
}

/**
 * +1 qualifying_logins for every active tournament where the player is an
 * active participant, then write a snapshot so scoring deltas pick it up.
 */
async function creditQualifyingLogin(uuid: string, username: string): Promise<void> {
    const norm = normalizeUuid(uuid);
    const active = await tournamentsRepo.getActive();
    if (active.length === 0) return;

    for (const t of active) {
        try {
            const participant = await tournamentsRepo.getParticipant(t.id, norm);
            if (!participant || participant.status !== 'active') continue;

            const newCount = await tournamentsRepo.incrementQualifyingLogins(t.id, norm);
            await snapshotWithQualifyingLogins(t.id, norm, username, newCount);

            consola.info(
                `[tournament] qualifying login +1 for ${username} in ${t.name} (total ${newCount})`
            );
        } catch (err) {
            consola.error(`[tournament] qualifying login credit failed for ${username}:`, err);
        }
    }
}
