import { Achievements, Duels } from '../../../../../../requests/fetch-hypixel-player-profile';
import getRandomHexColor from '../../../../../../util/getRandomHexColor';
import handleStatsCommand from '../../../../../../util/handleStatsCommand';

function buildStatsMessage(playerName: string, achievements: Achievements, stats: Duels): string {
    const kills = stats?.bridge_kills ?? 0;
    const deaths = stats?.bridge_deaths ?? 0;

    const bridgeWins = achievements?.bridge_wins ?? 0;
    const bridgeFourTeamsWins = achievements?.duels_bridge_four_teams_wins ?? 0;
    const bridgeDoublesWins = achievements?.duels_bridge_doubles_wins ?? 0;
    const bridge3v3v3v3Wins = stats?.bridge_3v3v3v3_wins ?? 0;
    const bridgeDuelsWins = achievements?.duels_bridge_duels_wins ?? 0;
    const bridgeTeamsWins = achievements?.duels_bridge_teams_wins ?? 0;
    const bridge2v2v2v2Wins = stats?.bridge_2v2v2v2_wins ?? 0;

    const wins =
        bridgeWins +
        bridgeFourTeamsWins +
        bridgeDoublesWins +
        bridge3v3v3v3Wins +
        bridgeDuelsWins +
        bridgeTeamsWins +
        bridge2v2v2v2Wins;

    const bridge3v3v3v3Losses = stats?.bridge_3v3v3v3_losses ?? 0;
    const bridgeDoublesLosses = stats?.bridge_doubles_losses ?? 0;
    const bridgeFourLosses = stats?.bridge_four_losses ?? 0;
    const bridgeDuelLosses = stats?.bridge_duel_losses ?? 0;
    const bridge2v2v2v2Losses = stats?.bridge_2v2v2v2_losses ?? 0;

    const losses =
        bridge3v3v3v3Losses +
        bridgeDoublesLosses +
        bridgeFourLosses +
        bridgeDuelLosses +
        bridge2v2v2v2Losses;

    const wlr = (losses === 0 ? wins : wins / losses).toFixed(2);
    const kdr = (deaths === 0 ? kills : kills / deaths).toFixed(2);

    return `/gc [Bridge Duels] IGN: ${playerName} | WINS: ${wins} | KILLS: ${kills} | KDR: ${kdr} | WLR: ${wlr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:duels-bridge',
    runOnce: false,
    run: async (bot, channel, playerRank, playerName, guildRank, target) => {
        await handleStatsCommand(
            bot,
            channel,
            playerRank,
            playerName,
            guildRank,
            target,
            'Duels',
            buildStatsMessage
        );
    },
} as Event;
