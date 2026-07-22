import { tournamentsRepo } from '@/db/repositories/tournaments.repo';
import {
    MAX_TEAM_SIZE,
    type TournamentParticipant,
    type TournamentRecord,
    type TournamentTeam,
} from '@/modules/tournament/types';

function normalizeUuid(uuid: string): string {
    return uuid.replace(/-/g, '').toLowerCase();
}

export class TeamError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TeamError';
    }
}

/** Teams may be formed/changed only while the tournament is draft or active. */
export function assertTeamEditable(tournament: TournamentRecord): void {
    if (tournament.status !== 'draft' && tournament.status !== 'active') {
        throw new TeamError(
            `Teams cannot be changed while the tournament is \`${tournament.status}\`.`
        );
    }
}

function assertName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 32) {
        throw new TeamError('Team name must be 2–32 characters.');
    }
    if (!/^[\w][\w \-']*$/u.test(trimmed)) {
        throw new TeamError(
            'Team name may only use letters, numbers, spaces, hyphens, and apostrophes.'
        );
    }
    return trimmed;
}

/**
 * Create a team. Creator becomes captain and is added as the first member.
 * Player may belong to at most one team per tournament.
 */
export async function createTeam(
    tournament: TournamentRecord,
    name: string,
    captain: { uuid: string; username: string }
): Promise<TournamentTeam> {
    assertTeamEditable(tournament);
    const teamName = assertName(name);
    const uuid = normalizeUuid(captain.uuid);

    const existingTeam = await tournamentsRepo.getTeamByName(tournament.id, teamName);
    if (existingTeam) throw new TeamError(`Team **${existingTeam.name}** already exists.`);

    const participant = await tournamentsRepo.ensureParticipantStub({
        tournament_id: tournament.id,
        uuid,
        username: captain.username,
    });
    if (participant.team_id) {
        throw new TeamError('You are already on a team in this tournament. Leave it first.');
    }

    const team = await tournamentsRepo.createTeam({
        tournament_id: tournament.id,
        name: teamName,
        captain_uuid: uuid,
    });
    await tournamentsRepo.setParticipantTeam(tournament.id, uuid, team.id);
    return team;
}

/** Captain (or staff caller) invites a player by UUID. Does not auto-join. */
export async function inviteToTeam(
    tournament: TournamentRecord,
    team: TournamentTeam,
    invitee: { uuid: string; username: string },
    actorUuid: string
): Promise<TournamentTeam> {
    assertTeamEditable(tournament);
    const inviteeUuid = normalizeUuid(invitee.uuid);
    const actor = normalizeUuid(actorUuid);

    if (team.captain_uuid !== actor) {
        throw new TeamError('Only the team captain can invite players.');
    }
    if (inviteeUuid === team.captain_uuid) {
        throw new TeamError('You cannot invite yourself.');
    }

    const members = await tournamentsRepo.listTeamMembers(tournament.id, team.id);
    if (members.length >= MAX_TEAM_SIZE) {
        throw new TeamError(`Team is full (max ${MAX_TEAM_SIZE} players).`);
    }

    const inviteePart = await tournamentsRepo.ensureParticipantStub({
        tournament_id: tournament.id,
        uuid: inviteeUuid,
        username: invitee.username,
    });
    if (inviteePart.team_id) {
        throw new TeamError(`**${invitee.username}** is already on a team.`);
    }

    if (team.pending_invites.includes(inviteeUuid)) {
        throw new TeamError(`**${invitee.username}** already has a pending invite.`);
    }

    const updated = await tournamentsRepo.updateTeam(team.id, {
        pending_invites: [...team.pending_invites, inviteeUuid],
    });
    if (!updated) throw new TeamError('Failed to save invite.');
    return updated;
}

/** Accept a pending invite and join the team roster. */
export async function joinTeam(
    tournament: TournamentRecord,
    team: TournamentTeam,
    player: { uuid: string; username: string }
): Promise<TournamentTeam> {
    assertTeamEditable(tournament);
    const uuid = normalizeUuid(player.uuid);

    if (!team.pending_invites.includes(uuid)) {
        throw new TeamError(
            `You do not have an invite to **${team.name}**. Ask the captain to invite you.`
        );
    }

    const members = await tournamentsRepo.listTeamMembers(tournament.id, team.id);
    if (members.length >= MAX_TEAM_SIZE) {
        throw new TeamError(`Team **${team.name}** is full (max ${MAX_TEAM_SIZE}).`);
    }

    const participant = await tournamentsRepo.ensureParticipantStub({
        tournament_id: tournament.id,
        uuid,
        username: player.username,
    });
    if (participant.team_id) {
        throw new TeamError('You are already on a team. Leave it before joining another.');
    }

    await tournamentsRepo.setParticipantTeam(tournament.id, uuid, team.id);
    const updated = await tournamentsRepo.updateTeam(team.id, {
        pending_invites: team.pending_invites.filter((u) => u !== uuid),
    });
    return updated ?? team;
}

/**
 * Leave the current team.
 *
 * Captain leave rule: if other members remain, transfer captaincy to the
 * earliest-enrolled remaining member (by `enrolled_at`). If the captain was
 * alone, disband the team (delete + clear roster).
 */
export async function leaveTeam(
    tournament: TournamentRecord,
    playerUuid: string
): Promise<{ disbanded: boolean; team: TournamentTeam | null; newCaptain: TournamentParticipant | null }> {
    assertTeamEditable(tournament);
    const uuid = normalizeUuid(playerUuid);

    const participant = await tournamentsRepo.getParticipant(tournament.id, uuid);
    if (!participant?.team_id) {
        throw new TeamError('You are not on a team in this tournament.');
    }

    const team = await tournamentsRepo.getTeam(participant.team_id);
    if (!team) {
        await tournamentsRepo.setParticipantTeam(tournament.id, uuid, null);
        throw new TeamError('Team record missing; cleared your team assignment.');
    }

    const members = await tournamentsRepo.listTeamMembers(tournament.id, team.id);
    const remaining = members.filter((m) => m.uuid !== uuid);

    await tournamentsRepo.setParticipantTeam(tournament.id, uuid, null);

    if (remaining.length === 0) {
        await tournamentsRepo.deleteTeam(team.id);
        return { disbanded: true, team, newCaptain: null };
    }

    let newCaptain: TournamentParticipant | null = null;
    if (team.captain_uuid === uuid) {
        // Transfer to earliest enrolled remaining member
        remaining.sort((a, b) => a.enrolled_at.localeCompare(b.enrolled_at));
        newCaptain = remaining[0]!;
        await tournamentsRepo.updateTeam(team.id, {
            captain_uuid: newCaptain.uuid,
            pending_invites: team.pending_invites.filter((u) => u !== uuid),
        });
        const refreshed = await tournamentsRepo.getTeam(team.id);
        return { disbanded: false, team: refreshed, newCaptain };
    }

    await tournamentsRepo.updateTeam(team.id, {
        pending_invites: team.pending_invites.filter((u) => u !== uuid),
    });
    return { disbanded: false, team: await tournamentsRepo.getTeam(team.id), newCaptain: null };
}

/** Captain kicks a member. Cannot kick self (use leave). Staff may pass `asStaff`. */
export async function kickFromTeam(
    tournament: TournamentRecord,
    team: TournamentTeam,
    targetUuid: string,
    actorUuid: string,
    asStaff = false
): Promise<{ disbanded: boolean }> {
    assertTeamEditable(tournament);
    const target = normalizeUuid(targetUuid);
    const actor = normalizeUuid(actorUuid);

    if (!asStaff && team.captain_uuid !== actor) {
        throw new TeamError('Only the team captain (or staff) can kick members.');
    }
    if (target === team.captain_uuid && !asStaff) {
        throw new TeamError('Captain cannot kick themselves — use `/tournament team leave`.');
    }

    const members = await tournamentsRepo.listTeamMembers(tournament.id, team.id);
    const member = members.find((m) => m.uuid === target);
    if (!member) throw new TeamError('That player is not on this team.');

    // Staff kicking the captain: treat like captain leave (transfer or disband)
    if (target === team.captain_uuid) {
        const result = await leaveTeam(tournament, target);
        return { disbanded: result.disbanded };
    }

    await tournamentsRepo.setParticipantTeam(tournament.id, target, null);
    await tournamentsRepo.updateTeam(team.id, {
        pending_invites: team.pending_invites.filter((u) => u !== target),
    });
    return { disbanded: false };
}

export async function getPlayerTeam(
    tournamentId: string,
    uuid: string
): Promise<{ team: TournamentTeam; members: TournamentParticipant[] } | null> {
    const participant = await tournamentsRepo.getParticipant(tournamentId, uuid);
    if (!participant?.team_id) return null;
    const team = await tournamentsRepo.getTeam(participant.team_id);
    if (!team) return null;
    const members = await tournamentsRepo.listTeamMembers(tournamentId, team.id);
    return { team, members };
}
