import { Achievements, Duels } from '../../../../../../requests/fetch-hypixel-player-profile';
import getRandomHexColor from '../../../../../../util/getRandomHexColor';
import handleStatsCommand from '../../../../../../util/handleStatsCommand';

function buildStatsMessage(playerName: string, achievements: Achievements, stats: Duels): string {
    const kills = stats?.classic_duel_kills ?? 0;
    const deaths = stats?.classic_duel_deaths ?? 0;

    const wins = stats?.classic_duel_wins ?? 0;
    const classicLosses = stats?.classic_duel_losses ?? 0;

    const wlr = (classicLosses === 0 ? wins : wins / classicLosses).toFixed(2);
    const kdr = (deaths === 0 ? kills : kills / deaths).toFixed(2);

    return `/gc [Classic Duels] IGN: ${playerName} | WINS: ${wins} | KILLS: ${kills} | KDR: ${kdr} | WLR: ${wlr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:duels-classic',
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
