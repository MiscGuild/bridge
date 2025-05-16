import { MCGO } from '@requests/fetch-hypixel-player-profile';
import handleStatsCommand from '../../../../../../util/handleStatsCommand';
import getRandomHexColor from '../../../../../../util/getRandomHexColor';

function buildStatsMessage(lookupName: string, achievements: any, stats: MCGO): string {
    const kills = stats?.kills ?? 0;
    const deaths = stats?.deaths ?? 0;
    const wins = stats?.game_wins ?? 0;

    const headshots = stats?.headshot_kills ?? 0;

    const kdr = (deaths === 0 ? kills : kills / deaths).toFixed(2);

    return `/gc [CVC-DEFUSAL] IGN: ${lookupName} | KILLS: ${kills}} | WINS: ${wins} | HEADSHOTS: ${headshots} | KDR: ${kdr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:cvc-stats-defusal',
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
