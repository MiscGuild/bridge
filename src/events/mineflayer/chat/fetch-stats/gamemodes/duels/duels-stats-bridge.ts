import { Achievements, Duels } from '../../../../../../requests/fetch-hypixel-player-profile';
import getRandomHexColor from '../../../../../../util/getRandomHexColor';
import handleStatsCommand from '../../../../../../util/handleStatsCommand';
import logger from '../../../../../../util/log-error';

function buildStatsMessage(playerName: string, achievements: Achievements, stats: Duels): string {
    // Bridge 1v1
    const bridge1v1Wins = stats?.bridge_duel_wins ?? 0;
    const bridge1v1Kills = stats?.bridge_duel_bridge_kills ?? 0;
    const bridge1v1Deaths = stats?.bridge_duel_bridge_deaths ?? 0;
    const bridge1v1Losses = stats?.bridge_duel_losses ?? 0;

    // Bridge 2v2
    const bridge2v2Wins = stats?.bridge_doubles_wins ?? 0;
    const bridge2v2Kills = stats?.bridge_doubles_bridge_kills ?? 0;
    const bridge2v2Deaths = stats?.bridge_doubles_bridge_deaths ?? 0;
    const bridge2v2Losses = stats?.bridge_doubles_losses ?? 0;

    // Bridge 3v3v3v3
    const bridge3v3v3v3Kills = stats?.bridge_3v3v3v3_bridge_kills ?? 0;
    const bridge3v3v3v3Deaths = stats?.bridge_3v3v3v3_bridge_deaths ?? 0;
    const bridge3v3v3v3Wins = stats?.bridge_3v3v3v3_wins ?? 0;
    const bridge3v3v3v3Losses = stats?.bridge_3v3v3v3_losses ?? 0;

    // Bridge 4v4 / Teams
    const bridgeTeamsWins = stats?.bridge_four_wins ?? 0;
    const bridgeTeamsKills = stats?.bridge_four_bridge_kills ?? 0;
    const bridgeTeamsDeaths = stats?.bridge_four_bridge_deaths ?? 0;
    const bridgeTeamsLosses = stats?.bridge_four_losses ?? 0;

    // Bridge 3v3
    const bridge3v3Wins = stats?.bridge_threes_wins ?? 0;
    const bridge3v3Losses = stats?.bridge_threes_losses ?? 0;
    const bridge3v3Kills = stats?.bridge_threes_bridge_kills ?? 0;
    const bridge3v3Deaths = stats?.bridge_threes_bridge_deaths ?? 0;

    // Bridge 2v2v2v2
    const bridge2v2v2v2Wins = stats?.bridge_2v2v2v2_wins ?? 0;
    const bridge2v2v2v2Losses = stats?.bridge_2v2v2v2_losses ?? 0;
    const bridge2v2v2v2Kills = stats?.bridge_2v2v2v2_bridge_kills ?? 0;
    const bridge2v2v2v2Deaths = stats?.bridge_2v2v2v2_bridge_deaths ?? 0;

    // Bridge CTF
    const bridgeCTFWins = stats?.capture_threes_wins ?? 0;
    const bridgeCTFLosses = stats?.capture_threes_losses ?? 0;
    const bridgeCTFKills = stats?.capture_threes_bridge_kills ?? 0;
    const bridgeCTFDeaths = stats?.capture_threes_bridge_deaths ?? 0;

    // Calculate total stats
    const wins =
        bridge1v1Wins +
        bridge2v2Wins +
        bridge3v3Wins +
        bridgeTeamsWins +
        bridge3v3v3v3Wins +
        bridge2v2v2v2Wins +
        bridgeCTFWins;
    const kills =
        bridge1v1Kills +
        bridge2v2Kills +
        bridge3v3Kills +
        bridgeTeamsKills +
        bridge3v3v3v3Kills +
        bridge2v2v2v2Kills +
        bridgeCTFKills;
    const deaths =
        bridge1v1Deaths +
        bridge2v2Deaths +
        bridge3v3Deaths +
        bridgeTeamsDeaths +
        bridge3v3v3v3Deaths +
        bridge2v2v2v2Deaths +
        bridgeCTFDeaths;
    const losses =
        bridge1v1Losses +
        bridge2v2Losses +
        bridge3v3Losses +
        bridgeTeamsLosses +
        bridge3v3v3v3Losses +
        bridge2v2v2v2Losses +
        bridgeCTFLosses;
    const kdr = deaths > 0 ? (kills / deaths).toFixed(2) : '∞';
    const wlr = losses > 0 ? (wins / losses).toFixed(2) : '∞';

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
