/**
 * Cops and Crims Stats Handler
 */

import { Achievements, MCGO, StatsHandler } from '../types';
import { getRandomHexColor, calculateRatio, formatNumber } from '../utils';

export const copsAndCrimsHandler: StatsHandler = {
    gameMode: 'MCGO',
    command: 'cvc',
    description: 'Check Cops and Crims stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: MCGO): string => {
        if (!stats) {
            return `No Cops and Crims stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const kills = stats.kills ?? 0;
        const deaths = stats.deaths ?? 0;
        const wins = stats.game_wins ?? 0;
        const roundWins = stats.round_wins ?? 0;

        // Calculate ratios
        const kdr = calculateRatio(kills, deaths);

        return `[Cops and Crims] IGN: ${playerName} | WINS: ${wins} | KDR: ${kdr} | KILLS: ${formatNumber(kills)} | ROUNDS: ${roundWins} | ${getRandomHexColor()}`;
    },
};
