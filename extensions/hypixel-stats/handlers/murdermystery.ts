/**
 * Murder Mystery Stats Handler
 */

import { Achievements, MurderMystery, StatsHandler } from '../types';
import { getRandomHexColor, calculateRatio, formatNumber } from '../utils';

export const murderMysteryHandler: StatsHandler = {
    gameMode: 'MurderMystery',
    command: 'mm',
    description: 'Check Murder Mystery stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: MurderMystery): string => {
        if (!stats) {
            return `/gc No Murder Mystery stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.wins ?? 0;
        const games = stats.games ?? 0;
        const kills = stats.kills ?? 0;
        const deaths = stats.deaths ?? 0;
        const murdererWins = stats.murderer_wins ?? 0;
        const detectiveWins = stats.detective_wins ?? 0;
        const classicWins = stats.wins_MURDER_CLASSIC ?? 0;
        const doubleUpWins = stats.wins_MURDER_DOUBLE_UP ?? 0;
        const assassinsWins = stats.wins_MURDER_ASSASSINS ?? 0;

        // Calculate ratios
        const kdr = calculateRatio(kills, deaths);
        const winRate = calculateRatio(wins, games, 1);

        return `/gc [Murder Mystery] IGN: ${playerName} | WINS: ${wins} | WR: ${winRate}% | KDR: ${kdr} | MURDERER: ${murdererWins} | DETECTIVE: ${detectiveWins} | CLASSIC: ${classicWins} | ${getRandomHexColor()}`;
    }
};
