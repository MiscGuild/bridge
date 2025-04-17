import { Achievements, Duels } from '../../../../../../requests/fetch-hypixel-player-profile';
import { getRandomHexColor } from '../../utils/getRandomHexColor';
import { handleStatsCommand } from '../../utils/handleStatsCommand';

function buildStatsMessage(playerName: string, achievements: Achievements, stats: Duels): string {
    const kills = stats?.bridge_kills ?? 0;
    const deaths = stats?.bridge_deaths ?? 0;

    const bridgeWins = stats?.bridge_wins ?? 0;
    const duels_bridge_four_teams_wins = stats?.duels_bridge_four_teams_wins ?? 0;
    const duels_bridge_doubles_wins = stats?.duels_bridge_doubles_wins ?? 0;
    const duels_bridge_3v3v3v3_wins = stats?.duels_bridge_3v3v3v3_wins ?? 0;
    const duels_bridge_duels_wins = stats?.duels_bridge_duels_wins ?? 0;
    const bridge_four_v_four_wins = stats?.bridge_four_v_four_wins ?? 0;
    const duels_bridge_teams_wins = stats?.duels_bridge_teams_wins ?? 0;
    const bridge_wins = stats?.bridge_wins ?? 0;
    const bridge_2v2v2v2_wins = stats?.bridge_2v2v2v2_wins ?? 0;
    const wins = bridgeWins + duels_bridge_four_teams_wins + duels_bridge_doubles_wins + duels_bridge_3v3v3v3_wins + duels_bridge_duels_wins + bridge_four_v_four_wins + duels_bridge_teams_wins + bridge_2v2v2v2_wins;

    const bridge_3v3v3v3_losses = stats?.bridge_3v3v3v3_losses ?? 0;
    const bridge_doubles_losses = stats?.bridge_doubles_losses ?? 0;
    const bridge_four_losses = stats?.bridge_four_losses ?? 0;
    const bridge_duel_losses = stats?.bridge_duel_losses ?? 0;
    const bridge_2v2v2v2_losses = stats?.bridge_2v2v2v2_losses ?? 0;
    const overallLosses = bridge_3v3v3v3_losses + bridge_doubles_losses + bridge_four_losses + bridge_duel_losses + bridge_2v2v2v2_losses;

    const wlr = ((overallLosses === 0) ? wins : wins / overallLosses).toFixed(2);
    const kdr = ((deaths === 0) ? kills : kills / deaths).toFixed(2);


    return `/gc [Bridge Duels] IGN: ${playerName} | WINS: ${wins} | KILLS: ${kills} | KDR: ${kdr} | WLR: ${wlr} | ${getRandomHexColor()}`;
}


export default {
    name: 'chat:duels-bridge',
    runOnce: false,
    run: async (bot, channel, playerRank, playerName, guildRank, target) => {
        await handleStatsCommand(bot, channel, playerRank, playerName, guildRank, target, 'Duels', buildStatsMessage);
    }
} as Event;


