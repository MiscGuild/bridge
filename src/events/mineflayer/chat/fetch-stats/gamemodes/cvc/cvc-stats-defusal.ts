import { handleStatsCommand } from '../../utils/handleStatsCommand';
import { getRandomHexColor } from '../../utils/getRandomHexColor';

function buildStatsMessage(
    lookupName: string,
    achievements: any,
    stats: any
): string {

    const kills = stats?.kills ?? 0;
    const deaths = stats?.deaths ?? 0;
    const wins = stats?.wins ?? 0;
    const losses = stats?.losses ?? 0;

    const headshots = stats?.headshots ?? 0;

    const kdr = ((deaths) === 0 ? kills : (kills / deaths)).toFixed(2);
    const wlr = ((losses) === 0 ? wins : (wins / losses)).toFixed(2);


    return `/gc [CVC-DEFUSAL] IGN: ${lookupName} | KILLS: ${kills}} | WINS: ${wins} | HEADSHOTS: ${headshots} | KDR: ${kdr} | WLR: ${wlr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:cvc-stats-defusal',
    runOnce: false,
    run: async (bot, channel, playerRank, playerName, guildRank, target) => {
        await handleStatsCommand(bot, channel, playerRank, playerName, guildRank, target, 'MCGO', buildStatsMessage);
    }
} as Event;