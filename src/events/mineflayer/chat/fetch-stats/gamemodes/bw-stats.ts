import { Achievements, Bedwars } from '../../../../../requests/fetch-hypixel-player-profile';
import getRandomHexColor from '../../../../../util/stat-utils/getRandomHexColor';
import handleStatsCommand from '../../../../../util/stat-utils/handleStatsCommand';

function buildStatsMessage(playerName: string, achievements: Achievements, stats: Bedwars): string {
    const level = achievements?.bedwars_level ?? 0;
    const soloWins = stats?.eight_one_wins_bedwars ?? 0;
    const doublesWins = stats?.eight_two_wins_bedwars ?? 0;
    const threesWins = stats?.four_three_wins_bedwars ?? 0;
    const foursWins = stats?.four_four_wins_bedwars ?? 0;

    const soloLosses = stats?.eight_one_losses_bedwars ?? 0;
    const doublesLosses = stats?.eight_two_losses_bedwars ?? 0;
    const threesLosses = stats?.four_three_losses_bedwars ?? 0;
    const foursLosses = stats?.four_four_losses_bedwars ?? 0;

    const soloBedBreaks = stats?.eight_one_beds_broken_bedwars ?? 0;
    const doublesBedBreaks = stats?.eight_two_beds_broken_bedwars ?? 0;
    const threesBedBreaks = stats?.four_three_beds_broken_bedwars ?? 0;
    const foursBedBreaks = stats?.four_four_beds_broken_bedwars ?? 0;

    const soloBedLosses = stats?.eight_one_beds_lost_bedwars ?? 0;
    const doublesBedLosses = stats?.eight_two_beds_lost_bedwars ?? 0;
    const threesBedLosses = stats?.four_three_beds_lost_bedwars ?? 0;
    const foursBedLosses = stats?.four_four_beds_lost_bedwars ?? 0;

    const finalKills = stats?.final_kills_bedwars ?? 0;
    const finalDeaths = !stats?.final_deaths_bedwars ? 1 : stats?.final_deaths_bedwars;

    const totalWins = soloWins + doublesWins + threesWins + foursWins;
    const totalLosses = soloLosses + doublesLosses + threesLosses + foursLosses;
    const totalBedBreaks = soloBedBreaks + doublesBedBreaks + threesBedBreaks + foursBedBreaks;
    const totalBedLosses = soloBedLosses + doublesBedLosses + threesBedLosses + foursBedLosses;
    const fkdr = (finalDeaths === 0 ? finalKills : finalKills / finalDeaths).toFixed(2);
    const wlr = (totalLosses === 0 ? totalWins : totalWins / totalLosses).toFixed(2);
    const bblr = (totalBedLosses === 0 ? totalBedBreaks : totalBedBreaks / totalBedLosses).toFixed(
        2
    );

    return `/gc [BedWars] IGN: ${playerName} | LVL: ${level} | WINS: ${totalWins} | FKDR: ${fkdr} | BBLR: ${bblr} | WLR: ${wlr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:bw-stats',
    runOnce: false,
    run: async (bot, channel, playerRank, playerName, guildRank, target) => {
        await handleStatsCommand(
            bot,
            channel,
            playerRank,
            playerName,
            guildRank,
            target,
            'Bedwars',
            buildStatsMessage
        );
    },
} as Event;
