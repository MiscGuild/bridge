import { Achievements, Duels } from '../../../../../../requests/fetch-hypixel-player-profile';
import getRandomHexColor from '../../../../../../util/getRandomHexColor';
import handleStatsCommand from '../../../../../../util/handleStatsCommand';

function buildStatsMessage(playerName: string, achievements: Achievements, stats: Duels): string {
    const soloKills = stats?.sw_duel_kills ?? 0;
    const doublesKills = stats?.sw_doubles_kills ?? 0;
    const kills = soloKills + doublesKills;

    const soloDeaths = stats?.sw_duel_deaths ?? 0;
    const doublesDeaths = stats?.sw_doubles_deaths ?? 0;
    const deaths = soloDeaths + doublesDeaths;

    const soloWins = stats?.sw_duel_wins ?? 0;
    const doublesWins = stats?.sw_doubles_wins ?? 0;
    const wins = soloWins + doublesWins;

    const soloLosses = stats?.sw_duel_losses ?? 0;
    const doublesLosses = stats?.sw_doubles_losses ?? 0;
    const losses = soloLosses + doublesLosses;

    const wlr = (losses === 0 ? wins : wins / losses).toFixed(2);
    const kdr = (deaths === 0 ? kills : kills / deaths).toFixed(2);

    return `/gc [SW Duels] IGN: ${playerName} | WINS: ${wins} | KILLS: ${kills} | KDR: ${kdr} | WLR: ${wlr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:duels-sw',
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
