import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';
import env from '@/config/env';
import { runCoralDqJob } from '@/modules/tournament/coral-dq';
import { resnapshotAllActive } from '@/modules/tournament/snapshots';
import { processWeeklyRollovers, runDailyDigestJob } from '@/modules/tournament/digest';
import { runPresenceCreditJob } from '@/modules/tournament/presence';

export { onGuildMemberJoined, onGuildMemberLeft } from '@/modules/tournament/membership';
export {
    snapshotGuildForStart,
    snapshotMember,
    fetchPlayerTournamentStats,
    resnapshotActiveTournament,
    resnapshotAllActive,
    snapshotWithQualifyingLogins,
} from '@/modules/tournament/snapshots';
export {
    announceTournamentCreated,
    announceTournamentStarted,
    announceTournamentEnded,
    announceTournamentCancelled,
    announceTeamCreated,
    announceTeamDisbanded,
    announceDailyDigest,
    announceWeeklySubWinners,
    announceParticipantDq,
} from '@/modules/tournament/announce';
export { buildLeaderboard, buildTeamLeaderboard, scorePlayerStanding, scoreParticipant } from '@/modules/tournament/scoring';
export {
    BALANCED_WEIGHTS,
    WEIGHT_PRESETS,
    MAX_TEAM_SIZE,
    emptyStats,
    type TournamentRecord,
    type LeaderboardEntry,
    type TeamLeaderboardEntry,
    type TournamentTeam,
    type TournamentWeekResult,
    type TournamentWeekWindow,
} from '@/modules/tournament/types';
export {
    computeWeightedScore,
    computeDelta,
    computeTeamHybridScore,
    extractTournamentStats,
} from '@/modules/tournament/metrics';
export {
    createTeam,
    inviteToTeam,
    joinTeam,
    leaveTeam,
    kickFromTeam,
    getPlayerTeam,
    TeamError,
} from '@/modules/tournament/teams';
export {
    getWeekWindows,
    getCurrentWeekWindow,
    getCompletedWeekWindows,
    buildWeeklySoloLeaderboard,
    buildWeeklyTeamLeaderboard,
    freezeWeekIfNeeded,
    freezePartialWeekOnEnd,
    buildTopMovers,
} from '@/modules/tournament/weeks';
export { postDailyDigest, runDailyDigestJob, processWeeklyRollovers, freezeWeeksOnTournamentEnd } from '@/modules/tournament/digest';
export {
    checkAndDqParticipant,
    checkTournamentParticipantsCoral,
    runCoralDqJob,
    manualDisqualify,
    manualUndisqualify,
    matchingDqTags,
    TOURNAMENT_DQ_TAG_TYPES,
} from '@/modules/tournament/coral-dq';
export {
    onPlayerOnline,
    onPlayerOffline,
    onGuildMembershipLeft,
    runPresenceCreditJob,
    QUALIFYING_LOGIN_MINUTES,
} from '@/modules/tournament/presence';

/**
 * Wire periodic resnapshot, Phase 3 digests, Phase 4 Coral DQ, Phase 5 presence.
 * Call from initModules after bridge is ready.
 */
export function initTournamentModule(bridge: Bridge): void {
    const intervalMs = env.TOURNAMENT_RESNAPSHOT_INTERVAL_MINUTES * 60 * 1000;

    const tick = () => {
        resnapshotAllActive().catch((err) =>
            consola.error('[tournament] resnapshot job error:', err)
        );
    };

    // First run delayed so startup guild sync / GEXP sync can finish
    setTimeout(tick, 90 * 1000);
    setInterval(tick, intervalMs);

    consola.info(
        `[tournament] resnapshot job scheduled every ${env.TOURNAMENT_RESNAPSHOT_INTERVAL_MINUTES}m`
    );

    // Phase 3: daily digest (check every hour; posts at TOURNAMENT_DAILY_DIGEST_HOUR UTC)
    const digestTick = () => {
        runDailyDigestJob(bridge).catch((err) =>
            consola.error('[tournament] daily digest job error:', err)
        );
    };
    setTimeout(digestTick, 120 * 1000);
    setInterval(digestTick, 60 * 60 * 1000);

    consola.info(
        `[tournament] daily digest check hourly (posts at ${env.TOURNAMENT_DAILY_DIGEST_HOUR}:00 UTC)`
    );

    // Phase 3: weekly rollover / sub-winner freeze + announce
    const weeklyIntervalMs = env.TOURNAMENT_WEEKLY_CHECK_INTERVAL_MINUTES * 60 * 1000;
    const weeklyTick = () => {
        processWeeklyRollovers(bridge).catch((err) =>
            consola.error('[tournament] weekly rollover job error:', err)
        );
    };
    setTimeout(weeklyTick, 150 * 1000);
    setInterval(weeklyTick, weeklyIntervalMs);

    consola.info(
        `[tournament] weekly rollover check every ${env.TOURNAMENT_WEEKLY_CHECK_INTERVAL_MINUTES}m`
    );

    // Phase 4: Coral auto-DQ sweep (skipped entirely when URCHIN_API_KEY unset)
    if (env.URCHIN_API_KEY) {
        const coralIntervalMs = env.TOURNAMENT_CORAL_CHECK_INTERVAL_MINUTES * 60 * 1000;
        const coralTick = () => {
            runCoralDqJob(bridge).catch((err) =>
                consola.error('[tournament] Coral DQ job error:', err)
            );
        };
        setTimeout(coralTick, 180 * 1000);
        setInterval(coralTick, coralIntervalMs);
        consola.info(
            `[tournament] Coral DQ check every ${env.TOURNAMENT_CORAL_CHECK_INTERVAL_MINUTES}m`
        );
    } else {
        consola.info('[tournament] Coral DQ disabled (URCHIN_API_KEY not set)');
    }

    // Phase 5: credit qualifying logins for open ≥15m presence streaks
    const presenceTick = () => {
        runPresenceCreditJob().catch((err) =>
            consola.error('[tournament] presence credit job error:', err)
        );
    };
    setTimeout(presenceTick, 60 * 1000);
    setInterval(presenceTick, 60 * 1000);
    consola.info('[tournament] presence credit check every 1m (≥15m streak → +1 login)');
}
