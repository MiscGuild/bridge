/**
 * UHC Stats Handler
 */

import { Achievements, UHC, StatsHandler } from '../types';
import { getRandomHexColor, calculateRatio, formatNumber } from '../utils';

export const uhcHandler: StatsHandler = {
    gameMode: 'UHC',
    command: 'uhc',
    description: 'Check UHC Champions stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: UHC): string => {
        if (!stats) {
            return `No UHC Champions stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.wins ?? 0;
        const soloWins = stats.wins_solo ?? 0;
        const teamWins = stats.wins_team ?? 0;
        const kills = stats.kills ?? 0;
        const deaths = stats.deaths ?? 0;
        const score = stats.score ?? 0;
        const headsEaten = stats.heads_eaten ?? 0;

        // Calculate ratios
        const kdr = calculateRatio(kills, deaths);

        return `[UHC] IGN: ${playerName} | WINS: ${wins} (S:${soloWins} T:${teamWins}) | KDR: ${kdr} | KILLS: ${formatNumber(kills)} | SCORE: ${formatNumber(score)} | HEADS: ${headsEaten} | ${getRandomHexColor()}`;
    },
};
