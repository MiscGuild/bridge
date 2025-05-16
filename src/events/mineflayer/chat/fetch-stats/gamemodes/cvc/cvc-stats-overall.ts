import { MCGO } from '@requests/fetch-hypixel-player-profile';
import handleStatsCommand from '../../../../../../util/handleStatsCommand';
import getRandomHexColor from '../../../../../../util/getRandomHexColor';

function buildStatsMessage(lookupName: string, achievements: any, stats: MCGO): string {
    const killsDefusal = stats?.kills ?? 0;
    const tdmKills = stats?.kills_deathmatch ?? 0;
    const killsOverall = killsDefusal + tdmKills;

    const deathsDefusal = stats?.deaths ?? 0;
    const deathsTDM = stats?.deaths_deathmatch ?? 0;
    const overallDeaths = deathsDefusal + deathsTDM;

    const winsTDM = stats?.game_wins_deathmatch ?? 0;
    const winsDefusal = stats?.game_wins ?? 0;
    const winsOverall = winsTDM + winsDefusal;

    const kdr = (overallDeaths === 0 ? killsOverall : killsOverall / overallDeaths).toFixed(2);

    const headshots = stats.headshot_kills;
    const bombs = stats.bombs_planted;

    return `/gc [CVC-OVERALL] IGN: ${lookupName} | KILLS: ${killsOverall} | WINS: ${winsOverall} | HEADSHOT KILLS: ${headshots} | BOMBS PLANTED: ${bombs} | KDR: ${kdr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:cvc-stats-overall',
    runOnce: false,
    run: async (bot, channel, playerRank, playerName, guildRank, target) => {
        await handleStatsCommand(
            bot,
            channel,
            playerRank,
            playerName,
            guildRank,
            target,
            'MCGO',
            buildStatsMessage
        );
    },
} as Event;
