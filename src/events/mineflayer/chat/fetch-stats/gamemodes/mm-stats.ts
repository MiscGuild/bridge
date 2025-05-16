import getRandomHexColor from '../../../../../util/stat-utils/getRandomHexColor';
import handleStatsCommand from '../../../../../util/stat-utils/handleStatsCommand';
import { MurderMystery } from '../../../../../requests/fetch-hypixel-player-profile';

function buildStatsMessage(lookupName: string, achievements: any, stats: MurderMystery): string {
    const wins = stats?.wins ?? 0;
    const gamesPlayed = stats?.games ?? 0;
    const kills = stats?.kills ?? 0;
    const deaths = stats?.deaths ?? 1;
    const kdr = (kills / deaths).toFixed(2);

    return `/gc [Murder Mystery] IGN: ${lookupName} | KILLS: ${kills} | WINS: ${wins} | KDR: ${kdr} | GAMES PLAYED: ${gamesPlayed} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:mm-stats',
    runOnce: false,
    run: async (bot, channel, playerRank, playerName, guildRank, target) => {
        await handleStatsCommand(
            bot,
            channel,
            playerRank,
            playerName,
            guildRank,
            target,
            'MurderMystery',
            buildStatsMessage
        );
    },
} as Event;
