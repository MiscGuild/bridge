import { EmbedBuilder, TextChannel } from 'discord.js';
import type Bridge from '@/bridge/bridge';
import env from '@/config/env';
import type { TournamentRecord, TournamentTeam } from '@/modules/tournament/types';

function resolveChannelId(tournament: TournamentRecord): string | null {
    return tournament.channel_id ?? env.TOURNAMENT_CHANNEL_ID ?? null;
}

async function sendToTournamentChannel(
    bridge: Bridge,
    tournament: TournamentRecord,
    embed: EmbedBuilder
): Promise<void> {
    const channelId = resolveChannelId(tournament);
    if (!channelId) return;
    try {
        const channel = await bridge.discord.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) return;
        await (channel as TextChannel).send({ embeds: [embed] });
    } catch {
        /* channel missing / no perms — non-fatal */
    }
}

function discordTs(iso: string): string {
    const unix = Math.floor(new Date(iso).getTime() / 1000);
    return `<t:${unix}:f> (<t:${unix}:R>)`;
}

export async function announceTournamentCreated(
    bridge: Bridge,
    tournament: TournamentRecord
): Promise<void> {
    const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Tournament created')
        .setDescription(`**${tournament.name}** is ready (draft).`)
        .addFields(
            { name: 'ID', value: `\`${tournament.id}\``, inline: false },
            { name: 'Starts', value: discordTs(tournament.starts_at), inline: true },
            { name: 'Ends', value: discordTs(tournament.ends_at), inline: true },
            {
                name: 'Weights',
                value: String(tournament.metrics.preset ?? 'balanced'),
                inline: true,
            }
        )
        .setFooter({ text: `Created by ${tournament.created_by}` });
    await sendToTournamentChannel(bridge, tournament, embed);
}

export async function announceTournamentStarted(
    bridge: Bridge,
    tournament: TournamentRecord,
    participantCount: number
): Promise<void> {
    const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('Tournament started')
        .setDescription(`**${tournament.name}** is now active.`)
        .addFields(
            { name: 'Participants', value: String(participantCount), inline: true },
            { name: 'Ends', value: discordTs(tournament.ends_at), inline: true },
            {
                name: 'Leaderboard',
                value: 'Use `/tournament leaderboard` (solo or team)',
                inline: false,
            }
        );
    await sendToTournamentChannel(bridge, tournament, embed);
}

export async function announceTournamentEnded(
    bridge: Bridge,
    tournament: TournamentRecord,
    podiums?: { soloLines?: string[]; teamLines?: string[] }
): Promise<void> {
    const solo = podiums?.soloLines ?? [];
    const teams = podiums?.teamLines ?? [];

    const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('Tournament ended')
        .setDescription(`**${tournament.name}** has ended.`)
        .addFields(
            {
                name: 'Solo podium',
                value: solo.length ? solo.join('\n') : '_No scored participants_',
            },
            {
                name: 'Team podium',
                value: teams.length ? teams.join('\n') : '_No teams_',
            }
        );
    await sendToTournamentChannel(bridge, tournament, embed);
}

export async function announceTournamentCancelled(
    bridge: Bridge,
    tournament: TournamentRecord
): Promise<void> {
    const embed = new EmbedBuilder()
        .setColor(0xfaa61a)
        .setTitle('Tournament cancelled')
        .setDescription(`**${tournament.name}** was cancelled.`);
    await sendToTournamentChannel(bridge, tournament, embed);
}

/** Light info post — team created (avoid spam; no invite/join noise). */
export async function announceTeamCreated(
    bridge: Bridge,
    tournament: TournamentRecord,
    team: TournamentTeam,
    captainUsername: string
): Promise<void> {
    const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Team created')
        .setDescription(
            `**${team.name}** joined **${tournament.name}** (captain: **${captainUsername}**).`
        );
    await sendToTournamentChannel(bridge, tournament, embed);
}

/** Light info post — team disbanded. */
export async function announceTeamDisbanded(
    bridge: Bridge,
    tournament: TournamentRecord,
    teamName: string
): Promise<void> {
    const embed = new EmbedBuilder()
        .setColor(0xfaa61a)
        .setTitle('Team disbanded')
        .setDescription(`**${teamName}** left **${tournament.name}**.`);
    await sendToTournamentChannel(bridge, tournament, embed);
}

/** Phase 3: daily digest — top movers + running overall (avoid spam; once/day). */
export async function announceDailyDigest(
    bridge: Bridge,
    tournament: TournamentRecord,
    payload: {
        moverLines: string[];
        soloLines: string[];
        teamLines: string[];
        weekLabel?: string;
    }
): Promise<void> {
    const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`Daily digest — ${tournament.name}`)
        .setDescription(
            payload.weekLabel
                ? `Running overall · ${payload.weekLabel}`
                : 'Running overall (full-window score)'
        )
        .addFields(
            {
                name: 'Top movers (24h)',
                value: payload.moverLines.length
                    ? payload.moverLines.join('\n')
                    : '_No positive movers_',
            },
            {
                name: 'Solo top 10',
                value: payload.soloLines.length
                    ? payload.soloLines.join('\n')
                    : '_No participants_',
            },
            {
                name: 'Team top 5',
                value: payload.teamLines.length ? payload.teamLines.join('\n') : '_No teams_',
            }
        )
        .setFooter({ text: 'Overall scoring is full-window · weekly slices are separate' });
    await sendToTournamentChannel(bridge, tournament, embed);
}

/** Phase 4: one embed per DQ event (Coral auto or staff). */
export async function announceParticipantDq(
    bridge: Bridge,
    tournament: TournamentRecord,
    payload: {
        username: string;
        uuid: string;
        tagTypes: string[];
        reason?: string;
    }
): Promise<void> {
    const tags =
        payload.tagTypes.length > 0
            ? payload.tagTypes.join(', ')
            : payload.reason ?? 'Disqualified';

    const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('Tournament disqualification')
        .setDescription(`**${payload.username}** was disqualified from **${tournament.name}**.`)
        .setThumbnail(`https://mc-heads.net/avatar/${payload.uuid}/64`)
        .addFields(
            {
                name: payload.tagTypes.length > 0 ? 'Coral tags' : 'Reason',
                value: tags,
                inline: false,
            }
        )
        .setFooter({ text: 'DQ’d players score 0 and are excluded from team hybrid' });
    await sendToTournamentChannel(bridge, tournament, embed);
}

/** Phase 3: weekly sub-winner announce (solo + team podiums for that week). */
export async function announceWeeklySubWinners(
    bridge: Bridge,
    tournament: TournamentRecord,
    payload: {
        weekNumber: number;
        weekStartsAt: string;
        weekEndsAt: string;
        soloLines: string[];
        teamLines: string[];
    }
): Promise<void> {
    const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle(`Week ${payload.weekNumber} winners — ${tournament.name}`)
        .setDescription(
            `Sub-winners for ${discordTs(payload.weekStartsAt)} → ${discordTs(payload.weekEndsAt)}`
        )
        .addFields(
            {
                name: 'Solo top 3',
                value: payload.soloLines.length
                    ? payload.soloLines.join('\n')
                    : '_No scored participants_',
            },
            {
                name: 'Team top 3',
                value: payload.teamLines.length ? payload.teamLines.join('\n') : '_No teams_',
            }
        )
        .setFooter({
            text: 'Weekly score = in-window delta · overall leaderboard unchanged',
        });
    await sendToTournamentChannel(bridge, tournament, embed);
}
