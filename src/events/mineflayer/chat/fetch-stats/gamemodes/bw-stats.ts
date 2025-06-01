import { Achievements, Bedwars } from '../../../../../requests/fetch-hypixel-player-profile';
import getRandomHexColor from '../../../../../util/getRandomHexColor';
import handleStatsCommand from '../../../../../util/handleStatsCommand';

function buildStatsMessage(playerName: string, achievements: Achievements, stats: Bedwars): string {
    const level = achievements?.bedwars_level ?? 0;
    const soloWins = stats?.eight_one_wins_bedwars ?? 0;
    const doublesWins = stats?.eight_two_wins_bedwars ?? 0;
    const threesWins = stats?.four_three_wins_bedwars ?? 0;
    const foursWins = stats?.four_four_wins_bedwars ?? 0;
    const foursFoursWins = stats?.two_four_wins_bedwars ?? 0;

    const soloLosses = stats?.eight_one_losses_bedwars ?? 0;
    const doublesLosses = stats?.eight_two_losses_bedwars ?? 0;
    const threesLosses = stats?.four_three_losses_bedwars ?? 0;
    const foursLosses = stats?.four_four_losses_bedwars ?? 0;
    const foursFoursLosses = stats?.two_four_losses_bedwars ?? 0;

    const soloBedBreaks = stats?.eight_one_beds_broken_bedwars ?? 0;
    const doublesBedBreaks = stats?.eight_two_beds_broken_bedwars ?? 0;
    const threesBedBreaks = stats?.four_three_beds_broken_bedwars ?? 0;
    const foursBedBreaks = stats?.four_four_beds_broken_bedwars ?? 0;
    const foursFoursBedBreaks = stats?.two_four_beds_broken_bedwars ?? 0;

    const soloBedLosses = stats?.eight_one_beds_lost_bedwars ?? 0;
    const doublesBedLosses = stats?.eight_two_beds_lost_bedwars ?? 0;
    const threesBedLosses = stats?.four_three_beds_lost_bedwars ?? 0;
    const foursBedLosses = stats?.four_four_beds_lost_bedwars ?? 0;
    const foursFoursBedLosses = stats?.two_four_beds_lost_bedwars ?? 0;

    const soloFinalKills = stats?.eight_one_final_kills_bedwars ?? 0;
    const doublesFinalKills = stats?.eight_two_final_kills_bedwars ?? 0;
    const threesFinalKills = stats?.four_three_final_kills_bedwars ?? 0;
    const foursFinalKills = stats?.four_four_final_kills_bedwars ?? 0;
    const foursFoursFinalKills = stats?.two_four_final_kills_bedwars ?? 0;

    const soloFinalDeaths = stats?.eight_one_final_deaths_bedwars ?? 0;
    const doublesFinalDeaths = stats?.eight_two_final_deaths_bedwars ?? 0;
    const threesFinalDeaths = stats?.four_three_final_deaths_bedwars ?? 0;
    const foursFinalDeaths = stats?.four_four_final_deaths_bedwars ?? 0;
    const foursFoursFinalDeaths = stats?.two_four_final_deaths_bedwars ?? 0;

    const wins = soloWins + doublesWins + threesWins + foursWins + foursFoursWins;
    const overallLosses =
        soloLosses + doublesLosses + threesLosses + foursLosses + foursFoursLosses;
    const overallBedBreaks =
        soloBedBreaks + doublesBedBreaks + threesBedBreaks + foursBedBreaks + foursFoursBedBreaks;
    const overallBedLosses =
        soloBedLosses + doublesBedLosses + threesBedLosses + foursBedLosses + foursFoursBedLosses;

    const overallFinalKills =
        soloFinalKills +
        doublesFinalKills +
        threesFinalKills +
        foursFinalKills +
        foursFoursFinalKills;

    const fkdr = (
        (soloFinalKills +
            doublesFinalKills +
            threesFinalKills +
            foursFinalKills +
            foursFoursFinalKills) /
        (soloFinalDeaths +
            doublesFinalDeaths +
            threesFinalDeaths +
            foursFinalDeaths +
            foursFoursFinalDeaths)
    ).toFixed(2);

    const wlr = (overallLosses === 0 ? wins : wins / overallLosses).toFixed(2);
    const bblr = (
        overallBedLosses === 0 ? overallBedBreaks : overallBedBreaks / overallBedLosses
    ).toFixed(2);

    return `/gc [BedWars] IGN: ${playerName} | LVL: ${level} | WINS: ${wins} | FKDR: ${fkdr} | FINALS: ${overallFinalKills} | BBLR: ${bblr} | WLR: ${wlr} | ${getRandomHexColor()}`;
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
