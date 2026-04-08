/**
 * Bedwars Stats Handler
 */

import { Achievements, Bedwars, StatsHandler } from '../types';
import { getRandomHexColor, calculateRatio, getBedwarsStarColor } from '../utils';

export const bedwarsHandler: StatsHandler = {
    gameMode: 'Bedwars',
    command: 'bw',
    description: 'Check Bedwars stats',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: Bedwars
    ): string => {
        if (!achievements || !stats) {
            return `No Bedwars stats found for ${playerName}. Are they nicked? | ${getRandomHexColor()}`;
        }

        const level = achievements.bedwars_level ?? 0;

        // Individual game mode stats
        const soloWins = stats.eight_one_wins_bedwars ?? 0;
        const doublesWins = stats.eight_two_wins_bedwars ?? 0;
        const threesWins = stats.four_three_wins_bedwars ?? 0;
        const foursWins = stats.four_four_wins_bedwars ?? 0;
        const foursFoursWins = stats.two_four_wins_bedwars ?? 0;

        const soloLosses = stats.eight_one_losses_bedwars ?? 0;
        const doublesLosses = stats.eight_two_losses_bedwars ?? 0;
        const threesLosses = stats.four_three_losses_bedwars ?? 0;
        const foursLosses = stats.four_four_losses_bedwars ?? 0;
        const foursFoursLosses = stats.two_four_losses_bedwars ?? 0;

        const soloBedBreaks = stats.eight_one_beds_broken_bedwars ?? 0;
        const doublesBedBreaks = stats.eight_two_beds_broken_bedwars ?? 0;
        const threesBedBreaks = stats.four_three_beds_broken_bedwars ?? 0;
        const foursBedBreaks = stats.four_four_beds_broken_bedwars ?? 0;
        const foursFoursBedBreaks = stats.two_four_beds_broken_bedwars ?? 0;

        const soloBedLosses = stats.eight_one_beds_lost_bedwars ?? 0;
        const doublesBedLosses = stats.eight_two_beds_lost_bedwars ?? 0;
        const threesBedLosses = stats.four_three_beds_lost_bedwars ?? 0;
        const foursBedLosses = stats.four_four_beds_lost_bedwars ?? 0;
        const foursFoursBedLosses = stats.two_four_beds_lost_bedwars ?? 0;

        const soloFinalKills = stats.eight_one_final_kills_bedwars ?? 0;
        const doublesFinalKills = stats.eight_two_final_kills_bedwars ?? 0;
        const threesFinalKills = stats.four_three_final_kills_bedwars ?? 0;
        const foursFinalKills = stats.four_four_final_kills_bedwars ?? 0;
        const foursFoursFinalKills = stats.two_four_final_kills_bedwars ?? 0;

        const soloFinalDeaths = stats.eight_one_final_deaths_bedwars ?? 0;
        const doublesFinalDeaths = stats.eight_two_final_deaths_bedwars ?? 0;
        const threesFinalDeaths = stats.four_three_final_deaths_bedwars ?? 0;
        const foursFinalDeaths = stats.four_four_final_deaths_bedwars ?? 0;
        const foursFoursFinalDeaths = stats.two_four_final_deaths_bedwars ?? 0;

        // Calculate totals
        const totalWins = soloWins + doublesWins + threesWins + foursWins + foursFoursWins;
        const totalLosses =
            soloLosses + doublesLosses + threesLosses + foursLosses + foursFoursLosses;
        const totalBedBreaks =
            soloBedBreaks +
            doublesBedBreaks +
            threesBedBreaks +
            foursBedBreaks +
            foursFoursBedBreaks;
        const totalBedLosses =
            soloBedLosses +
            doublesBedLosses +
            threesBedLosses +
            foursBedLosses +
            foursFoursBedLosses;
        const totalFinalKills =
            soloFinalKills +
            doublesFinalKills +
            threesFinalKills +
            foursFinalKills +
            foursFoursFinalKills;
        const totalFinalDeaths =
            soloFinalDeaths +
            doublesFinalDeaths +
            threesFinalDeaths +
            foursFinalDeaths +
            foursFoursFinalDeaths;

        // Calculate ratios
        const fkdr = calculateRatio(totalFinalKills, totalFinalDeaths);
        const wlr = calculateRatio(totalWins, totalLosses);
        const bblr = calculateRatio(totalBedBreaks, totalBedLosses);

        const levelDisplay = getBedwarsStarColor(level);

        return `[BedWars] ${levelDisplay} ${playerName} | WINS: ${totalWins} | FINALS: ${totalFinalKills} | FKDR: ${fkdr} | BBLR: ${bblr} | WLR: ${wlr} | ${getRandomHexColor()}`;
    },
};

export const bedwarsSoloHandler: StatsHandler = {
    gameMode: 'Bedwars',
    command: 'bw solo',
    aliases: ['bw 1s', 'bw solos'],
    description: 'Check Bedwars solo stats',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: Bedwars
    ): string => {
        if (!achievements || !stats) {
            return `No Bedwars solo stats found for ${playerName}. Are they nicked? | ${getRandomHexColor()}`;
        }

        const level = achievements.bedwars_level ?? 0;
        const wins = stats.eight_one_wins_bedwars ?? 0;
        const losses = stats.eight_one_losses_bedwars ?? 0;
        const finalKills = stats.eight_one_final_kills_bedwars ?? 0;
        const finalDeaths = stats.eight_one_final_deaths_bedwars ?? 0;
        const bedBreaks = stats.eight_one_beds_broken_bedwars ?? 0;
        const bedLosses = stats.eight_one_beds_lost_bedwars ?? 0;

        const fkdr = calculateRatio(finalKills, finalDeaths);
        const wlr = calculateRatio(wins, losses);
        const bblr = calculateRatio(bedBreaks, bedLosses);
        const levelDisplay = getBedwarsStarColor(level);

        return `[BW Solo] ${levelDisplay} ${playerName} | WINS: ${wins} | FINALS: ${finalKills} | FKDR: ${fkdr} | BBLR: ${bblr} | WLR: ${wlr} | ${getRandomHexColor()}`;
    },
};

export const bedwarsDoublesHandler: StatsHandler = {
    gameMode: 'Bedwars',
    command: 'bw doubles',
    aliases: ['bw 2s', 'bw duos'],
    description: 'Check Bedwars doubles stats',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: Bedwars
    ): string => {
        if (!achievements || !stats) {
            return `No Bedwars doubles stats found for ${playerName}. Are they nicked? | ${getRandomHexColor()}`;
        }

        const level = achievements.bedwars_level ?? 0;
        const wins = stats.eight_two_wins_bedwars ?? 0;
        const losses = stats.eight_two_losses_bedwars ?? 0;
        const finalKills = stats.eight_two_final_kills_bedwars ?? 0;
        const finalDeaths = stats.eight_two_final_deaths_bedwars ?? 0;
        const bedBreaks = stats.eight_two_beds_broken_bedwars ?? 0;
        const bedLosses = stats.eight_two_beds_lost_bedwars ?? 0;

        const fkdr = calculateRatio(finalKills, finalDeaths);
        const wlr = calculateRatio(wins, losses);
        const bblr = calculateRatio(bedBreaks, bedLosses);
        const levelDisplay = getBedwarsStarColor(level);

        return `[BW Doubles] ${levelDisplay} ${playerName} | WINS: ${wins} | FINALS: ${finalKills} | FKDR: ${fkdr} | BBLR: ${bblr} | WLR: ${wlr} | ${getRandomHexColor()}`;
    },
};

export const bedwarsThreesHandler: StatsHandler = {
    gameMode: 'Bedwars',
    command: 'bw threes',
    aliases: ['bw 3s', 'bw 3v3', 'bw trios'],
    description: 'Check Bedwars threes stats',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: Bedwars
    ): string => {
        if (!achievements || !stats) {
            return `No Bedwars threes stats found for ${playerName}. Are they nicked? | ${getRandomHexColor()}`;
        }

        const level = achievements.bedwars_level ?? 0;
        const wins = stats.four_three_wins_bedwars ?? 0;
        const losses = stats.four_three_losses_bedwars ?? 0;
        const finalKills = stats.four_three_final_kills_bedwars ?? 0;
        const finalDeaths = stats.four_three_final_deaths_bedwars ?? 0;
        const bedBreaks = stats.four_three_beds_broken_bedwars ?? 0;
        const bedLosses = stats.four_three_beds_lost_bedwars ?? 0;

        const fkdr = calculateRatio(finalKills, finalDeaths);
        const wlr = calculateRatio(wins, losses);
        const bblr = calculateRatio(bedBreaks, bedLosses);
        const levelDisplay = getBedwarsStarColor(level);

        return `[BW Threes] ${levelDisplay} ${playerName} | WINS: ${wins} | FINALS: ${finalKills} | FKDR: ${fkdr} | BBLR: ${bblr} | WLR: ${wlr} | ${getRandomHexColor()}`;
    },
};

export const bedwarsFoursHandler: StatsHandler = {
    gameMode: 'Bedwars',
    command: 'bw fours',
    aliases: ['bw 4s', 'bw 4v4v4v4', 'bw quads'],
    description: 'Check Bedwars fours stats',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: Bedwars
    ): string => {
        if (!achievements || !stats) {
            return `No Bedwars fours stats found for ${playerName}. Are they nicked? | ${getRandomHexColor()}`;
        }

        const level = achievements.bedwars_level ?? 0;
        const wins = stats.four_four_wins_bedwars ?? 0;
        const losses = stats.four_four_losses_bedwars ?? 0;
        const finalKills = stats.four_four_final_kills_bedwars ?? 0;
        const finalDeaths = stats.four_four_final_deaths_bedwars ?? 0;
        const bedBreaks = stats.four_four_beds_broken_bedwars ?? 0;
        const bedLosses = stats.four_four_beds_lost_bedwars ?? 0;

        const fkdr = calculateRatio(finalKills, finalDeaths);
        const wlr = calculateRatio(wins, losses);
        const bblr = calculateRatio(bedBreaks, bedLosses);
        const levelDisplay = getBedwarsStarColor(level);

        return `[BW 4s] ${levelDisplay} ${playerName} | WINS: ${wins} | FINALS: ${finalKills} | FKDR: ${fkdr} | BBLR: ${bblr} | WLR: ${wlr} | ${getRandomHexColor()}`;
    },
};

export const bedwars4v4Handler: StatsHandler = {
    gameMode: 'Bedwars',
    command: 'bw 4v4',
    description: 'Check Bedwars 4v4 stats',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: Bedwars
    ): string => {
        if (!achievements || !stats) {
            return `No Bedwars 4v4 stats found for ${playerName}. Are they nicked? | ${getRandomHexColor()}`;
        }

        const level = achievements.bedwars_level ?? 0;
        const wins = stats.two_four_wins_bedwars ?? 0;
        const losses = stats.two_four_losses_bedwars ?? 0;
        const finalKills = stats.two_four_final_kills_bedwars ?? 0;
        const finalDeaths = stats.two_four_final_deaths_bedwars ?? 0;
        const bedBreaks = stats.two_four_beds_broken_bedwars ?? 0;
        const bedLosses = stats.two_four_beds_lost_bedwars ?? 0;

        const fkdr = calculateRatio(finalKills, finalDeaths);
        const wlr = calculateRatio(wins, losses);
        const bblr = calculateRatio(bedBreaks, bedLosses);
        const levelDisplay = getBedwarsStarColor(level);

        return `[BW 4v4] ${levelDisplay} ${playerName} | WINS: ${wins} | FINALS: ${finalKills} | FKDR: ${fkdr} | BBLR: ${bblr} | WLR: ${wlr} | ${getRandomHexColor()}`;
    },
};
