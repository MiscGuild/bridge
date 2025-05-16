import { MCGO } from '@requests/fetch-hypixel-player-profile';
import handleStatsCommand from '../../../../../../util/handleStatsCommand';
import getRandomHexColor from '../../../../../../util/getRandomHexColor';

function buildStatsMessage(lookupName: string, achievements: any, stats: MCGO): string {
    const tdmKills = stats?.kills_deathmatch ?? 0;
    const deathsTDM = stats?.deaths_deathmatch ?? 0;

    const winsTDM = stats?.game_wins_deathmatch ?? 0;

    const kdr = (deathsTDM === 0 ? tdmKills : tdmKills / deathsTDM).toFixed(2);

    return `/gc [CVC-TDM] IGN: ${lookupName} | KILLS: ${tdmKills} | WINS: ${winsTDM} | KDR: ${kdr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:cvc-stats-tdm',
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
