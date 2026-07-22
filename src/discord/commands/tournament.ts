import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    GuildMember,
    type ChatInputCommandInteraction,
} from 'discord.js';
import type Bridge from '@/bridge/bridge';
import env from '@/config/env';
import { tournamentsRepo } from '@/db/repositories/tournaments.repo';
import { hypixelService } from '@/services/hypixel';
import { mojangService } from '@/services/mojang';
import {
    MAX_TEAM_SIZE,
    WEIGHT_PRESETS,
    type TournamentRecord,
    type TournamentWeekResult,
    type WeightPresetName,
} from '@/modules/tournament/types';
import {
    announceTeamCreated,
    announceTeamDisbanded,
    announceTournamentCancelled,
    announceTournamentCreated,
    announceTournamentEnded,
    announceTournamentStarted,
    buildLeaderboard,
    buildTeamLeaderboard,
    buildWeeklySoloLeaderboard,
    buildWeeklyTeamLeaderboard,
    checkTournamentParticipantsCoral,
    createTeam,
    getCurrentWeekWindow,
    getPlayerTeam,
    getWeekWindows,
    inviteToTeam,
    joinTeam,
    kickFromTeam,
    leaveTeam,
    manualDisqualify,
    manualUndisqualify,
    postDailyDigest,
    scorePlayerStanding,
    snapshotGuildForStart,
    TeamError,
} from '@/modules/tournament/index';

function isStaff(interaction: ChatInputCommandInteraction): boolean {
    const member = interaction.member as GuildMember;
    return member.roles.cache.has(env.STAFF_ROLE_ID) || member.id === env.BOT_OWNER_ID;
}

async function requireStaff(interaction: ChatInputCommandInteraction): Promise<boolean> {
    if (isStaff(interaction)) return true;
    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor('Red')
                .setTitle('Error')
                .setDescription('You do not have permission to use this command!'),
        ],
        ephemeral: true,
    });
    return false;
}

function parseDateInput(raw: string): Date | null {
    const trimmed = raw.trim();
    const discordTsMatch = trimmed.match(/<?t?:?(\d{10,13})(?::[a-zA-Z])?>?/);
    if (discordTsMatch?.[1]) {
        const n = Number(discordTsMatch[1]);
        const ms = n > 1e12 ? n : n * 1000;
        const d = new Date(ms);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
}

function discordTs(iso: string): string {
    const unix = Math.floor(new Date(iso).getTime() / 1000);
    return `<t:${unix}:f>`;
}

function fmtScore(n: number): string {
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

async function resolveTournament(
    interaction: ChatInputCommandInteraction,
    prefer: 'active' | 'draft' | 'any' = 'active'
): Promise<TournamentRecord | null> {
    const id = interaction.options.getString('id');
    if (id) {
        const t = await tournamentsRepo.getById(id);
        if (!t) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder().setColor('Red').setDescription(`Tournament not found: \`${id}\``),
                ],
            });
            return null;
        }
        return t;
    }

    if (prefer === 'active') {
        const t = await tournamentsRepo.getLatest(['active']);
        if (t) return t;
    }
    if (prefer === 'draft') {
        const t = await tournamentsRepo.getLatest(['draft']);
        if (t) return t;
    }
    if (prefer === 'any') {
        const t = await tournamentsRepo.getLatest(['active', 'draft', 'ended', 'cancelled']);
        if (t) return t;
    }

    const active = await tournamentsRepo.getLatest(['active']);
    if (active) return active;
    const draft = await tournamentsRepo.getLatest(['draft']);
    if (draft) return draft;
    const ended = await tournamentsRepo.getLatest(['ended']);
    if (ended) return ended;

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Yellow')
                .setDescription('No tournament found. Create one with `/tournament create`.'),
        ],
    });
    return null;
}

async function fetchGuildMembers(): Promise<{ uuid: string; username?: string }[]> {
    const guild = await hypixelService.getGuildByName(env.HYPIXEL_GUILD_NAME);
    if (!guild) throw new Error('Could not fetch guild from Hypixel');
    return guild.members.map((m) => ({ uuid: m.uuid }));
}

/** Resolve Minecraft profile from option or Discord display name. */
async function resolveMcPlayer(
    interaction: ChatInputCommandInteraction,
    optionName = 'username'
): Promise<{ id: string; name: string } | null> {
    let username = interaction.options.getString(optionName);
    if (!username) {
        const member = interaction.member as GuildMember | null;
        username =
            member?.displayName?.split(' ')[0] ?? interaction.user.username ?? null;
    }
    if (!username) return null;
    return mojangService.getProfile(username);
}

const teamNameOption = {
    name: 'name',
    description: 'Team name',
    type: ApplicationCommandOptionType.String,
    required: true,
} as const;

const teamOptionalId = {
    name: 'id',
    description: 'Tournament ID (defaults to active/draft)',
    type: ApplicationCommandOptionType.String,
    required: false,
} as const;

export default {
    data: {
        name: 'tournament',
        description: 'Guild tournament management and leaderboard',
        options: [
            {
                name: 'create',
                description: 'Create a draft tournament (staff)',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'name',
                        description: 'Tournament name',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'start',
                        description: 'Start time (ISO date or unix timestamp)',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'end',
                        description: 'End time (ISO date or unix timestamp)',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'channel',
                        description: 'Announce channel ID (optional)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                    {
                        name: 'preset',
                        description: 'Weight preset (default: balanced)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                        choices: [{ name: 'balanced', value: 'balanced' }],
                    },
                ],
            },
            {
                name: 'start',
                description: 'Start a draft tournament — snapshot & enroll guild (staff)',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'id',
                        description: 'Tournament ID (defaults to latest draft)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'end',
                description: 'End an active tournament (staff)',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'id',
                        description: 'Tournament ID (defaults to active)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'cancel',
                description: 'Cancel a draft or active tournament (staff)',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'id',
                        description: 'Tournament ID (defaults to latest draft/active)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'info',
                description: 'Show tournament details',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'id',
                        description: 'Tournament ID (defaults to active)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'leaderboard',
                description: 'Show tournament leaderboard (solo or team)',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'type',
                        description: 'solo (default) or team',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                        choices: [
                            { name: 'solo', value: 'solo' },
                            { name: 'team', value: 'team' },
                        ],
                    },
                    {
                        name: 'top',
                        description: 'Number of entries (default 10, max 25)',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        minValue: 1,
                        maxValue: 25,
                    },
                    {
                        name: 'id',
                        description: 'Tournament ID (defaults to active)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'me',
                description: 'Show your personal tournament standing',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'username',
                        description: 'Minecraft username (defaults to Discord display name)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                    {
                        name: 'id',
                        description: 'Tournament ID (defaults to active)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'weeks',
                description: 'Weekly sub-winners and current week standing (Phase 3)',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'week',
                        description: 'Week number (defaults to current / latest)',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        minValue: 1,
                    },
                    {
                        name: 'id',
                        description: 'Tournament ID (defaults to active)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'digest',
                description: 'Force-post the daily digest to the tournament channel (staff)',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'id',
                        description: 'Tournament ID (defaults to active)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'dq',
                description: 'Manually disqualify a participant (staff)',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'player',
                        description: 'Minecraft username',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'id',
                        description: 'Tournament ID (defaults to active)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'undq',
                description: 'Clear a participant disqualification (staff)',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'player',
                        description: 'Minecraft username',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'id',
                        description: 'Tournament ID (defaults to active)',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'team',
                description: 'Team management (Phase 2)',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'create',
                        description: 'Create a team (you become captain)',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            teamNameOption,
                            {
                                name: 'username',
                                description: 'Your Minecraft username (defaults to display name)',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                            },
                            teamOptionalId,
                        ],
                    },
                    {
                        name: 'invite',
                        description: 'Invite a player to your team (captain)',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'player',
                                description: 'Minecraft username to invite',
                                type: ApplicationCommandOptionType.String,
                                required: true,
                            },
                            {
                                name: 'username',
                                description: 'Your Minecraft username (captain)',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                            },
                            teamOptionalId,
                        ],
                    },
                    {
                        name: 'join',
                        description: 'Accept a team invite',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'name',
                                description: 'Team name to join',
                                type: ApplicationCommandOptionType.String,
                                required: true,
                            },
                            {
                                name: 'username',
                                description: 'Your Minecraft username',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                            },
                            teamOptionalId,
                        ],
                    },
                    {
                        name: 'leave',
                        description: 'Leave your current team',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'username',
                                description: 'Your Minecraft username',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                            },
                            teamOptionalId,
                        ],
                    },
                    {
                        name: 'kick',
                        description: 'Kick a member from your team (captain/staff)',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'player',
                                description: 'Minecraft username to kick',
                                type: ApplicationCommandOptionType.String,
                                required: true,
                            },
                            {
                                name: 'username',
                                description: 'Your Minecraft username (captain)',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                            },
                            teamOptionalId,
                        ],
                    },
                    {
                        name: 'info',
                        description: 'Show team roster and score',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'name',
                                description: 'Team name (defaults to your team)',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                            },
                            {
                                name: 'username',
                                description: 'Your Minecraft username (to find your team)',
                                type: ApplicationCommandOptionType.String,
                                required: false,
                            },
                            teamOptionalId,
                        ],
                    },
                    {
                        name: 'list',
                        description: 'List all teams in the tournament',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [teamOptionalId],
                    },
                ],
            },
        ],
    },
    run: async (bridge: Bridge, interaction: ChatInputCommandInteraction) => {
        const group = interaction.options.getSubcommandGroup(false);
        const sub = interaction.options.getSubcommand();

        const staffSubs = new Set(['create', 'start', 'end', 'cancel', 'digest', 'dq', 'undq']);
        if (!group && staffSubs.has(sub) && !(await requireStaff(interaction))) return;

        try {
            if (group === 'team') {
                await handleTeamGroup(bridge, interaction, sub);
                return;
            }

            if (sub === 'create') await handleCreate(bridge, interaction);
            else if (sub === 'start') await handleStart(bridge, interaction);
            else if (sub === 'end') await handleEnd(bridge, interaction);
            else if (sub === 'cancel') await handleCancel(bridge, interaction);
            else if (sub === 'info') await handleInfo(interaction);
            else if (sub === 'leaderboard') await handleLeaderboard(interaction);
            else if (sub === 'me') await handleMe(interaction);
            else if (sub === 'weeks') await handleWeeks(interaction);
            else if (sub === 'digest') await handleDigest(bridge, interaction);
            else if (sub === 'dq') await handleDq(bridge, interaction);
            else if (sub === 'undq') await handleUndq(interaction);
        } catch (e) {
            const msg = e instanceof TeamError || e instanceof Error ? e.message : String(e);
            const embed = new EmbedBuilder().setColor('Red').setTitle('Error').setDescription(msg);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },
    staffOnly: false,
};

async function handleCreate(
    bridge: Bridge,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const name = interaction.options.getString('name', true);
    const startRaw = interaction.options.getString('start', true);
    const endRaw = interaction.options.getString('end', true);
    const channel = interaction.options.getString('channel');
    const presetName = (interaction.options.getString('preset') ?? 'balanced') as WeightPresetName;

    const start = parseDateInput(startRaw);
    const end = parseDateInput(endRaw);
    if (!start || !end) {
        await interaction.editReply({
            content:
                'Invalid start/end date. Use ISO (e.g. `2026-07-22T18:00:00Z`) or a unix timestamp.',
        });
        return;
    }
    if (end.getTime() <= start.getTime()) {
        await interaction.editReply({ content: 'End time must be after start time.' });
        return;
    }

    const weights = WEIGHT_PRESETS[presetName] ?? WEIGHT_PRESETS.balanced;
    const createdBy = interaction.user.username ?? interaction.user.tag ?? interaction.user.id;

    const tournament = await tournamentsRepo.create({
        name,
        metrics: { preset: presetName, weights },
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        channel_id: channel ?? env.TOURNAMENT_CHANNEL_ID ?? null,
        created_by: createdBy,
    });

    await announceTournamentCreated(bridge, tournament);

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Green')
                .setTitle('Tournament created')
                .setDescription(`**${tournament.name}** (\`${tournament.id}\`)`)
                .addFields(
                    { name: 'Start', value: discordTs(tournament.starts_at), inline: true },
                    { name: 'End', value: discordTs(tournament.ends_at), inline: true },
                    { name: 'Preset', value: presetName, inline: true },
                    {
                        name: 'Next',
                        value: 'Run `/tournament start` when ready to snapshot & enroll. Teams can form in draft or active.',
                    }
                ),
        ],
    });
}

async function handleStart(
    bridge: Bridge,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    await interaction.deferReply();

    const tournament = await resolveTournament(interaction, 'draft');
    if (!tournament) return;

    if (tournament.status !== 'draft') {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(
                        `Tournament **${tournament.name}** is \`${tournament.status}\`, not draft.`
                    ),
            ],
        });
        return;
    }

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor(0xfaa61a)
                .setTitle('Starting tournament…')
                .setDescription(
                    'Fetching guild roster and taking baseline snapshots. This may take a minute.'
                ),
        ],
    });

    const members = await fetchGuildMembers();
    const { enrolled, failed } = await snapshotGuildForStart(tournament.id, members);

    const updated = await tournamentsRepo.updateStatus(tournament.id, 'active', {
        started_at: new Date().toISOString(),
    });
    if (!updated) throw new Error('Failed to mark tournament active');

    // Phase 4: Coral auto-DQ sweep on enroll (skipped if no URCHIN_API_KEY)
    const coral = await checkTournamentParticipantsCoral(bridge, updated);

    await announceTournamentStarted(bridge, updated, enrolled);

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Green')
                .setTitle('Tournament started')
                .setDescription(`**${updated.name}** is now active.`)
                .addFields(
                    { name: 'Enrolled', value: String(enrolled), inline: true },
                    { name: 'Failed snapshots', value: String(failed), inline: true },
                    { name: 'Coral DQ', value: String(coral.dqed), inline: true },
                    { name: 'Ends', value: discordTs(updated.ends_at), inline: true }
                ),
        ],
    });
}

async function handleEnd(
    bridge: Bridge,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    await interaction.deferReply();

    const tournament = await resolveTournament(interaction, 'active');
    if (!tournament) return;

    if (tournament.status !== 'active') {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`Tournament is \`${tournament.status}\`, not active.`),
            ],
        });
        return;
    }

    const { resnapshotActiveTournament } = await import('@/modules/tournament/snapshots');
    await resnapshotActiveTournament(tournament.id).catch(() => 0);

    // Freeze completed + current partial week before closing
    try {
        const { freezeWeeksOnTournamentEnd } = await import('@/modules/tournament/digest');
        await freezeWeeksOnTournamentEnd(bridge, tournament);
    } catch {
        /* non-fatal */
    }

    const soloBoard = await buildLeaderboard(tournament, 3);
    const teamBoard = await buildTeamLeaderboard(tournament, 3);
    const soloLines = soloBoard.map(
        (e) => `**#${e.rank}** ${e.username} — ${fmtScore(e.score)} pts`
    );
    const teamLines = teamBoard.map(
        (e) =>
            `**#${e.rank}** ${e.name} — ${fmtScore(e.score)} pts (${e.member_count}/${MAX_TEAM_SIZE} scoring)`
    );

    const updated = await tournamentsRepo.updateStatus(tournament.id, 'ended', {
        ended_at: new Date().toISOString(),
    });
    if (!updated) throw new Error('Failed to end tournament');

    await announceTournamentEnded(bridge, updated, { soloLines, teamLines });

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Green')
                .setTitle('Tournament ended')
                .setDescription(`**${updated.name}**`)
                .addFields(
                    {
                        name: 'Solo podium',
                        value: soloLines.length ? soloLines.join('\n') : '_No participants_',
                    },
                    {
                        name: 'Team podium',
                        value: teamLines.length ? teamLines.join('\n') : '_No teams_',
                    }
                ),
        ],
    });
}

async function handleCancel(
    bridge: Bridge,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const id = interaction.options.getString('id');
    let tournament: TournamentRecord | null = null;
    if (id) {
        tournament = await tournamentsRepo.getById(id);
    } else {
        tournament = await tournamentsRepo.getLatest(['draft', 'active']);
    }

    if (!tournament) {
        await interaction.editReply({ content: 'No draft/active tournament to cancel.' });
        return;
    }
    if (tournament.status === 'ended' || tournament.status === 'cancelled') {
        await interaction.editReply({
            content: `Tournament is already \`${tournament.status}\`.`,
        });
        return;
    }

    const updated = await tournamentsRepo.updateStatus(tournament.id, 'cancelled', {
        ended_at: new Date().toISOString(),
    });
    if (!updated) throw new Error('Failed to cancel tournament');

    await announceTournamentCancelled(bridge, updated);

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Orange')
                .setTitle('Tournament cancelled')
                .setDescription(`**${updated.name}** (\`${updated.id}\`)`),
        ],
    });
}

async function handleInfo(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    const tournament = await resolveTournament(interaction, 'any');
    if (!tournament) return;

    const participants = await tournamentsRepo.listParticipants(tournament.id);
    const activeCount = participants.filter((p) => p.status === 'active').length;
    const teams = await tournamentsRepo.listTeams(tournament.id);
    const weeks = getWeekWindows(tournament.starts_at, tournament.ends_at);
    const currentWeek = getCurrentWeekWindow(tournament);
    const frozen = await tournamentsRepo.listWeekResults(tournament.id);

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle(tournament.name)
                .addFields(
                    { name: 'ID', value: `\`${tournament.id}\``, inline: false },
                    { name: 'Status', value: `\`${tournament.status}\``, inline: true },
                    {
                        name: 'Preset',
                        value: String(tournament.metrics.preset ?? 'balanced'),
                        inline: true,
                    },
                    {
                        name: 'Participants',
                        value: `${activeCount} active / ${participants.length} total`,
                        inline: true,
                    },
                    { name: 'Teams', value: String(teams.length), inline: true },
                    {
                        name: 'Weeks',
                        value:
                            weeks.length === 0
                                ? '—'
                                : currentWeek
                                  ? `${currentWeek.week_number} / ${weeks.length} (current)`
                                  : `${frozen.length} frozen / ${weeks.length} total`,
                        inline: true,
                    },
                    { name: 'Starts', value: discordTs(tournament.starts_at), inline: true },
                    { name: 'Ends', value: discordTs(tournament.ends_at), inline: true },
                    {
                        name: 'Created by',
                        value: tournament.created_by,
                        inline: true,
                    }
                )
                .setFooter({
                    text: 'Overall = full-window · /tournament weeks for sub-winners',
                }),
        ],
    });
}

async function handleLeaderboard(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    const tournament = await resolveTournament(interaction, 'active');
    if (!tournament) return;

    const top = interaction.options.getInteger('top') ?? 10;
    const type = (interaction.options.getString('type') ?? 'solo') as 'solo' | 'team';

    if (type === 'team') {
        const board = await buildTeamLeaderboard(tournament, top);
        if (board.length === 0) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Yellow')
                        .setDescription('No teams yet. Create one with `/tournament team create`.'),
                ],
            });
            return;
        }
        const lines = board.map(
            (e) =>
                `\`${e.rank}.\` **${e.name}** — **${fmtScore(e.score)}** (${e.member_count}/${MAX_TEAM_SIZE} scoring · capt. ${e.captain_username})`
        );
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle(`Team leaderboard — ${tournament.name}`)
                    .setDescription(lines.join('\n'))
                    .setFooter({
                        text: `Hybrid: 0.7×avg + 0.3×(sum/${MAX_TEAM_SIZE}) • Status: ${tournament.status}`,
                    }),
            ],
        });
        return;
    }

    const board = await buildLeaderboard(tournament, top);
    if (board.length === 0) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Yellow')
                    .setDescription('No participants yet. Has the tournament been started?'),
            ],
        });
        return;
    }

    const lines = board.map((e) => {
        const tag =
            e.status === 'left' ? ' _(left)_' : e.status === 'disqualified' ? ' _(DQ)_' : '';
        return `\`${e.rank}.\` **${e.username}**${tag} — **${fmtScore(e.score)}**`;
    });

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle(`Solo leaderboard — ${tournament.name}`)
                .setDescription(lines.join('\n'))
                .setFooter({
                    text: `Status: ${tournament.status} • Weights: ${tournament.metrics.preset ?? 'balanced'}`,
                }),
        ],
    });
}

async function handleMe(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    const tournament = await resolveTournament(interaction, 'active');
    if (!tournament) return;

    const profile = await resolveMcPlayer(interaction, 'username');
    if (!profile) {
        await interaction.editReply({
            content: 'Provide a Minecraft `username` option.',
        });
        return;
    }

    const standing = await scorePlayerStanding(tournament, profile.id);
    if (!standing) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Yellow')
                    .setDescription(
                        `**${profile.name}** is not enrolled in **${tournament.name}**.`
                    ),
            ],
        });
        return;
    }

    const { entry, totalParticipants } = standing;
    const d = entry.delta;
    const teamInfo = await getPlayerTeam(tournament.id, profile.id);

    const fields = [
        {
            name: 'Rank',
            value: `#${entry.rank} / ${totalParticipants}`,
            inline: true,
        },
        { name: 'Score', value: fmtScore(entry.score), inline: true },
        { name: 'Status', value: `\`${entry.status}\``, inline: true },
        {
            name: 'Team',
            value: teamInfo
                ? `**${teamInfo.team.name}** (${teamInfo.members.length}/${MAX_TEAM_SIZE})${
                      teamInfo.team.captain_uuid === profile.id.replace(/-/g, '').toLowerCase()
                          ? ' · captain'
                          : ''
                  }`
                : '_Solo (no team)_',
            inline: false,
        },
        {
            name: 'Deltas',
            value: [
                `Duels W: +${d.duels_wins}`,
                `TNT/BB/Party W: +${d.tnt_wins}/+${d.bb_wins}/+${d.party_wins}`,
                `SW W: +${d.sw_wins}`,
                `BW W / FK: +${d.bw_wins} / +${d.bw_final_kills}`,
                `GEXP: +${d.gexp}`,
                `Qual. logins: +${d.qualifying_logins}`,
            ].join('\n'),
        },
    ];

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle(`${profile.name} — ${tournament.name}`)
                .setThumbnail(`https://mc-heads.net/avatar/${profile.id}/64`)
                .addFields(fields),
        ],
    });
}

async function handleWeeks(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    const tournament = await resolveTournament(interaction, 'any');
    if (!tournament) return;

    const windows = getWeekWindows(tournament.starts_at, tournament.ends_at);
    if (windows.length === 0) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Yellow')
                    .setDescription('No week windows for this tournament.'),
            ],
        });
        return;
    }

    const requested = interaction.options.getInteger('week');
    const current = getCurrentWeekWindow(tournament);
    const weekNumber =
        requested ?? current?.week_number ?? windows[windows.length - 1]!.week_number;

    const window = windows.find((w) => w.week_number === weekNumber);
    if (!window) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(
                        `Week **${weekNumber}** is out of range (1–${windows.length}).`
                    ),
            ],
        });
        return;
    }

    const frozen: TournamentWeekResult | null = await tournamentsRepo.getWeekResult(
        tournament.id,
        weekNumber
    );

    let soloLines: string[];
    let teamLines: string[];
    let statusNote: string;

    if (frozen) {
        soloLines = frozen.solo_podium.map(
            (e) => `**#${e.rank}** ${e.username} — ${fmtScore(e.score)} pts`
        );
        teamLines = frozen.team_podium.map(
            (e) =>
                `**#${e.rank}** ${e.name} — ${fmtScore(e.score)} pts (${e.member_count} scoring)`
        );
        statusNote = `Frozen <t:${Math.floor(new Date(frozen.frozen_at).getTime() / 1000)}:R>`;
    } else {
        const soloBoard = await buildWeeklySoloLeaderboard(tournament, window, 3);
        const teamBoard = await buildWeeklyTeamLeaderboard(tournament, window, 3);
        soloLines = soloBoard.map(
            (e) => `**#${e.rank}** ${e.username} — ${fmtScore(e.score)} pts`
        );
        teamLines = teamBoard.map(
            (e) =>
                `**#${e.rank}** ${e.name} — ${fmtScore(e.score)} pts (${e.member_count} scoring)`
        );
        const ended = new Date(window.ends_at).getTime() <= Date.now();
        statusNote = ended
            ? 'Completed — awaiting freeze/announce'
            : 'In progress (live weekly standing)';
    }

    const frozenList = await tournamentsRepo.listWeekResults(tournament.id);
    const overview =
        windows
            .map((w) => {
                const done = frozenList.some((f) => f.week_number === w.week_number);
                const cur = current?.week_number === w.week_number;
                const mark = done ? '✓' : cur ? '→' : '·';
                return `\`${mark}\` W${w.week_number}`;
            })
            .join('  ') || '—';

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle(`Week ${weekNumber} — ${tournament.name}`)
                .setDescription(
                    `${discordTs(window.starts_at)} → ${discordTs(window.ends_at)}\n${statusNote}`
                )
                .addFields(
                    {
                        name: 'Solo top 3',
                        value: soloLines.length ? soloLines.join('\n') : '_No scores_',
                    },
                    {
                        name: 'Team top 3',
                        value: teamLines.length ? teamLines.join('\n') : '_No teams_',
                    },
                    {
                        name: 'All weeks',
                        value: overview,
                    }
                )
                .setFooter({
                    text: 'Weekly = in-window delta · overall leaderboard is full-window',
                }),
        ],
    });
}

async function handleDigest(
    bridge: Bridge,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const tournament = await resolveTournament(interaction, 'active');
    if (!tournament) return;

    if (tournament.status !== 'active') {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`Tournament is \`${tournament.status}\`, not active.`),
            ],
        });
        return;
    }

    const result = await postDailyDigest(bridge, tournament, { force: true });
    if (!result.posted) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Yellow')
                    .setDescription(result.reason ?? 'Digest was not posted.'),
            ],
        });
        return;
    }

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Green')
                .setTitle('Daily digest posted')
                .setDescription(
                    `Forced digest for **${tournament.name}** sent to the tournament channel.`
                ),
        ],
    });
}

async function handleDq(
    bridge: Bridge,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    await interaction.deferReply();
    const tournament = await resolveTournament(interaction, 'active');
    if (!tournament) return;

    const player = interaction.options.getString('player', true);
    const profile = await mojangService.getProfile(player);
    if (!profile) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`Could not resolve Minecraft user \`${player}\`.`),
            ],
        });
        return;
    }

    const { changed } = await manualDisqualify(
        bridge,
        tournament,
        profile.id,
        profile.name,
        'Staff DQ'
    );

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor(changed ? 'Red' : 'Yellow')
                .setTitle(changed ? 'Participant disqualified' : 'Already disqualified')
                .setDescription(
                    changed
                        ? `**${profile.name}** was DQ'd from **${tournament.name}**.`
                        : `**${profile.name}** is already disqualified in **${tournament.name}**.`
                )
                .setThumbnail(`https://mc-heads.net/avatar/${profile.id}/64`),
        ],
    });
}

async function handleUndq(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    const tournament = await resolveTournament(interaction, 'active');
    if (!tournament) return;

    const player = interaction.options.getString('player', true);
    const profile = await mojangService.getProfile(player);
    if (!profile) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`Could not resolve Minecraft user \`${player}\`.`),
            ],
        });
        return;
    }

    const { changed } = await manualUndisqualify(tournament, profile.id, profile.name);

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor(changed ? 'Green' : 'Yellow')
                .setTitle(changed ? 'Disqualification cleared' : 'Not disqualified')
                .setDescription(
                    changed
                        ? `**${profile.name}** is active again in **${tournament.name}**.` +
                              (env.URCHIN_API_KEY
                                  ? '\n_Note: a later Coral sweep may re-DQ if flagged tags remain._'
                                  : '')
                        : `**${profile.name}** is not disqualified in **${tournament.name}**.`
                )
                .setThumbnail(`https://mc-heads.net/avatar/${profile.id}/64`),
        ],
    });
}

// ── Team subcommands ───────────────────────────────────────────────────────────

async function handleTeamGroup(
    bridge: Bridge,
    interaction: ChatInputCommandInteraction,
    sub: string
): Promise<void> {
    if (sub === 'create') await handleTeamCreate(bridge, interaction);
    else if (sub === 'invite') await handleTeamInvite(interaction);
    else if (sub === 'join') await handleTeamJoin(interaction);
    else if (sub === 'leave') await handleTeamLeave(bridge, interaction);
    else if (sub === 'kick') await handleTeamKick(bridge, interaction);
    else if (sub === 'info') await handleTeamInfo(interaction);
    else if (sub === 'list') await handleTeamList(interaction);
}

async function resolveEditableTournament(
    interaction: ChatInputCommandInteraction
): Promise<TournamentRecord | null> {
    // Prefer active, then draft — teams are only editable in those states
    const id = interaction.options.getString('id');
    if (id) {
        const t = await tournamentsRepo.getById(id);
        if (!t) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder().setColor('Red').setDescription(`Tournament not found: \`${id}\``),
                ],
            });
            return null;
        }
        return t;
    }
    const active = await tournamentsRepo.getLatest(['active']);
    if (active) return active;
    const draft = await tournamentsRepo.getLatest(['draft']);
    if (draft) return draft;
    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Yellow')
                .setDescription('No draft/active tournament found.'),
        ],
    });
    return null;
}

async function handleTeamCreate(
    bridge: Bridge,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    await interaction.deferReply();
    const tournament = await resolveEditableTournament(interaction);
    if (!tournament) return;

    const profile = await resolveMcPlayer(interaction, 'username');
    if (!profile) {
        await interaction.editReply({ content: 'Provide a Minecraft `username` option.' });
        return;
    }

    const name = interaction.options.getString('name', true);
    const team = await createTeam(tournament, name, {
        uuid: profile.id,
        username: profile.name,
    });

    await announceTeamCreated(bridge, tournament, team, profile.name).catch(() => undefined);

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Green')
                .setTitle('Team created')
                .setDescription(`**${team.name}** in **${tournament.name}**`)
                .addFields(
                    { name: 'Captain', value: profile.name, inline: true },
                    {
                        name: 'Roster',
                        value: `1 / ${MAX_TEAM_SIZE}`,
                        inline: true,
                    },
                    {
                        name: 'Next',
                        value: 'Invite teammates with `/tournament team invite`.',
                    }
                ),
        ],
    });
}

async function handleTeamInvite(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    const tournament = await resolveEditableTournament(interaction);
    if (!tournament) return;

    const captain = await resolveMcPlayer(interaction, 'username');
    if (!captain) {
        await interaction.editReply({ content: 'Provide your Minecraft `username`.' });
        return;
    }

    const playerName = interaction.options.getString('player', true);
    const invitee = await mojangService.getProfile(playerName);
    if (!invitee) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`Player not found: **${playerName}**`),
            ],
        });
        return;
    }

    const mine = await getPlayerTeam(tournament.id, captain.id);
    if (!mine) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Yellow')
                    .setDescription('You are not on a team. Create one first.'),
            ],
        });
        return;
    }

    const updated = await inviteToTeam(
        tournament,
        mine.team,
        { uuid: invitee.id, username: invitee.name },
        captain.id
    );

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Green')
                .setTitle('Invite sent')
                .setDescription(
                    `Invited **${invitee.name}** to **${updated.name}**. They can join with \`/tournament team join name:${updated.name}\`.`
                ),
        ],
    });
}

async function handleTeamJoin(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    const tournament = await resolveEditableTournament(interaction);
    if (!tournament) return;

    const profile = await resolveMcPlayer(interaction, 'username');
    if (!profile) {
        await interaction.editReply({ content: 'Provide a Minecraft `username` option.' });
        return;
    }

    const name = interaction.options.getString('name', true);
    const team = await tournamentsRepo.getTeamByName(tournament.id, name);
    if (!team) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder().setColor('Red').setDescription(`No team named **${name}**.`),
            ],
        });
        return;
    }

    const joined = await joinTeam(tournament, team, {
        uuid: profile.id,
        username: profile.name,
    });
    const members = await tournamentsRepo.listTeamMembers(tournament.id, joined.id);

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Green')
                .setTitle('Joined team')
                .setDescription(`**${profile.name}** joined **${joined.name}**.`)
                .addFields({
                    name: 'Roster',
                    value: `${members.length} / ${MAX_TEAM_SIZE}`,
                    inline: true,
                }),
        ],
    });
}

async function handleTeamLeave(
    bridge: Bridge,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    await interaction.deferReply();
    const tournament = await resolveEditableTournament(interaction);
    if (!tournament) return;

    const profile = await resolveMcPlayer(interaction, 'username');
    if (!profile) {
        await interaction.editReply({ content: 'Provide a Minecraft `username` option.' });
        return;
    }

    const result = await leaveTeam(tournament, profile.id);

    if (result.disbanded && result.team) {
        await announceTeamDisbanded(bridge, tournament, result.team.name).catch(() => undefined);
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Orange')
                    .setTitle('Team disbanded')
                    .setDescription(
                        `**${profile.name}** left and **${result.team.name}** was disbanded (no members left).`
                    ),
            ],
        });
        return;
    }

    const transferNote = result.newCaptain
        ? `\nCaptaincy transferred to **${result.newCaptain.username}**.`
        : '';

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Green')
                .setTitle('Left team')
                .setDescription(
                    `**${profile.name}** left **${result.team?.name ?? 'the team'}**.${transferNote}`
                ),
        ],
    });
}

async function handleTeamKick(
    bridge: Bridge,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    await interaction.deferReply();
    const tournament = await resolveEditableTournament(interaction);
    if (!tournament) return;

    const targetName = interaction.options.getString('player', true);
    const target = await mojangService.getProfile(targetName);
    if (!target) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`Player not found: **${targetName}**`),
            ],
        });
        return;
    }

    const staff = isStaff(interaction);
    let team = null as Awaited<ReturnType<typeof getPlayerTeam>>;

    if (staff) {
        // Staff: find target's team
        team = await getPlayerTeam(tournament.id, target.id);
        if (!team) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Yellow')
                        .setDescription(`**${target.name}** is not on a team.`),
                ],
            });
            return;
        }
    } else {
        const captain = await resolveMcPlayer(interaction, 'username');
        if (!captain) {
            await interaction.editReply({ content: 'Provide your Minecraft `username`.' });
            return;
        }
        team = await getPlayerTeam(tournament.id, captain.id);
        if (!team) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Yellow')
                        .setDescription('You are not on a team.'),
                ],
            });
            return;
        }
        const result = await kickFromTeam(tournament, team.team, target.id, captain.id, false);
        if (result.disbanded) {
            await announceTeamDisbanded(bridge, tournament, team.team.name).catch(() => undefined);
        }
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Green')
                    .setTitle(result.disbanded ? 'Team disbanded' : 'Member kicked')
                    .setDescription(
                        result.disbanded
                            ? `Kicked **${target.name}**; **${team.team.name}** was disbanded.`
                            : `Kicked **${target.name}** from **${team.team.name}**.`
                    ),
            ],
        });
        return;
    }

    // Staff path
    const actorUuid = team.team.captain_uuid;
    const result = await kickFromTeam(tournament, team.team, target.id, actorUuid, true);
    if (result.disbanded) {
        await announceTeamDisbanded(bridge, tournament, team.team.name).catch(() => undefined);
    }
    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Green')
                .setTitle(result.disbanded ? 'Team disbanded' : 'Member kicked')
                .setDescription(
                    result.disbanded
                        ? `Staff removed **${target.name}**; **${team.team.name}** was disbanded.`
                        : `Staff kicked **${target.name}** from **${team.team.name}**.`
                ),
        ],
    });
}

async function handleTeamInfo(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    // Info is read-only — allow ended tournaments (mutations still gated in team helpers)
    const tournament = await resolveTournament(interaction, 'any');
    if (!tournament) return;

    const name = interaction.options.getString('name');
    let team = name ? await tournamentsRepo.getTeamByName(tournament.id, name) : null;

    if (!team) {
        const profile = await resolveMcPlayer(interaction, 'username');
        if (profile) {
            const mine = await getPlayerTeam(tournament.id, profile.id);
            team = mine?.team ?? null;
        }
    }

    if (!team) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Yellow')
                    .setDescription(
                        'Specify a team `name`, or use a `username` that is on a team.'
                    ),
            ],
        });
        return;
    }

    const members = await tournamentsRepo.listTeamMembers(tournament.id, team.id);
    const board = await buildTeamLeaderboard(tournament, Number.MAX_SAFE_INTEGER);
    const entry = board.find((e) => e.team_id === team!.id);

    const roster = members
        .map((m) => {
            const capt = m.uuid === team!.captain_uuid ? ' ★' : '';
            const tag =
                m.status === 'left' ? ' _(left)_' : m.status === 'disqualified' ? ' _(DQ)_' : '';
            const pts = entry?.members.find((x) => x.uuid === m.uuid)?.score;
            return `• **${m.username}**${capt}${tag}${pts !== undefined ? ` — ${fmtScore(pts)}` : ''}`;
        })
        .join('\n');

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle(`${team.name} — ${tournament.name}`)
                .addFields(
                    {
                        name: 'Hybrid score',
                        value: entry ? fmtScore(entry.score) : '0',
                        inline: true,
                    },
                    {
                        name: 'Rank',
                        value: entry ? `#${entry.rank}` : '—',
                        inline: true,
                    },
                    {
                        name: 'Roster',
                        value: `${members.length} / ${MAX_TEAM_SIZE}`,
                        inline: true,
                    },
                    {
                        name: 'Members',
                        value: roster || '_Empty_',
                    },
                    {
                        name: 'Pending invites',
                        value: team.pending_invites.length
                            ? `${team.pending_invites.length} pending`
                            : '_None_',
                        inline: true,
                    }
                ),
        ],
    });
}

async function handleTeamList(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    const tournament = await resolveTournament(interaction, 'any');
    if (!tournament) return;

    const teams = await tournamentsRepo.listTeams(tournament.id);
    if (teams.length === 0) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Yellow')
                    .setDescription('No teams yet.'),
            ],
        });
        return;
    }

    const board = await buildTeamLeaderboard(tournament, Number.MAX_SAFE_INTEGER);
    const scoreById = new Map(board.map((e) => [e.team_id, e]));

    const lines = await Promise.all(
        teams.map(async (t) => {
            const members = await tournamentsRepo.listTeamMembers(tournament.id, t.id);
            const scored = scoreById.get(t.id);
            const capt =
                members.find((m) => m.uuid === t.captain_uuid)?.username ??
                t.captain_uuid.slice(0, 8);
            return `• **${t.name}** — ${members.length}/${MAX_TEAM_SIZE} · capt. ${capt}${
                scored ? ` · ${fmtScore(scored.score)} pts` : ''
            }`;
        })
    );

    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle(`Teams — ${tournament.name}`)
                .setDescription(lines.join('\n')),
        ],
    });
}
