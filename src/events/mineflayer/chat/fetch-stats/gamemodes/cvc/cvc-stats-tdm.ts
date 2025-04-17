import { handleStatsCommand } from '../../utils/handleStatsCommand';
import { getRandomHexColor } from '../../utils/getRandomHexColor';

function buildStatsMessage(
    lookupName: string,
    achievements: any,
    stats: any
): string {
    const tdmKills = stats.kills_deathmatch;
    const deathsTDM = stats.deaths_deathmatch;

    const winsTDM = stats.game_wins_deathmatch;
    const lossesTDM = stats.game_losses_deathmatch;

    const kdr = ((deathsTDM === 0 ? tdmKills : tdmKills / deathsTDM)).toFixed(2);
    const wlr = ((lossesTDM === 0 ? winsTDM : winsTDM / lossesTDM)).toFixed(2);

    return `/gc [CVC-TDM] IGN: ${lookupName} | KILLS: ${tdmKills} | WINS: ${winsTDM} | KDR: ${kdr} | WLR: ${wlr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:cvc-stats-tdm',
    runOnce: false,
    run: async (bot, channel, playerRank, playerName, guildRank, target) => {
        await handleStatsCommand(bot, channel, playerRank, playerName, guildRank, target, 'MCGO', buildStatsMessage);
    }
} as Event;