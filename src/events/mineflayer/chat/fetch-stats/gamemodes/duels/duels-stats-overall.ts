import { Achievements, Duels } from '../../../../../../requests/fetch-hypixel-player-profile';
import getRandomHexColor from '../../../../../../util/getRandomHexColor';
import handleStatsCommand from '../../../../../../util/handleStatsCommand';

function buildStatsMessage(playerName: string, achievements: Achievements, stats: Duels): string {
    const kills = stats?.kills ?? 0;
    const deaths = stats?.deaths ?? 0;

    const wins = stats?.wins ?? 0;
    const losses = stats?.losses ?? 0;

    const wlr = (losses === 0 ? wins : wins / losses).toFixed(2);
    const kdr = (deaths === 0 ? kills : kills / deaths).toFixed(2);

    return `/gc [Duels] IGN: ${playerName} | WINS: ${wins} | KILLS: ${kills} | KDR: ${wlr} | WLR: ${kdr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:duels-overall',
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
