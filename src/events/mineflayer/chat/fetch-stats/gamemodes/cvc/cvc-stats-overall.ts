import { handleStatsCommand } from '../../utils/handleStatsCommand';
import { getRandomHexColor } from '../../utils/getRandomHexColor';

function buildStatsMessage(
    lookupName: string,
    achievements: any,
    stats: any
): string {
    const killsDefusal = stats.kills;
    const tdmKills = stats.kills_deathmatch;
    const killsOverall = killsDefusal + tdmKills;

    const deathsDefusal = stats.deaths;
    const deathsTDM = stats.deaths_deathmatch;
    const overallDeaths = deathsDefusal + deathsTDM;


    const winsTDM = stats.game_wins_deathmatch;
    const winsDefusal = stats.game_wins; 
    const winsOverall = winsTDM + winsDefusal; 

    const lossesTDM = stats.game_losses_deathmatch;
    const lossesDefusal = stats.game_losses;
    const lossesOverall = lossesTDM + lossesDefusal;


    const kdr = ((overallDeaths === 0 ? killsOverall : killsOverall / overallDeaths)).toFixed(2);
    const wlr = ((lossesOverall === 0 ? winsOverall : winsOverall / lossesOverall)).toFixed(2);
    
    const headshots = stats.headshot_kills;
    const bombs = stats.bombs_planted;

    return `/gc [CVC-OVERALL] IGN: ${lookupName} | KILLS: ${killsOverall} | WINS: ${winsOverall} | HEADSHOT KILLS: ${headshots} | BOMBS PLANTED: ${bombs} | KDR: ${kdr} | WLR: ${wlr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:cvc-stats-overall',
    runOnce: false,
    run: async (bot, channel, playerRank, playerName, guildRank, target) => {
        await handleStatsCommand(bot, channel, playerRank, playerName, guildRank, target, 'MCGO', buildStatsMessage);
    }
} as Event;