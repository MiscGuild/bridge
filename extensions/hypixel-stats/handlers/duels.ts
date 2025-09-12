/**
 * Duels Stats Handler
 */

import { Achievements, Duels, StatsHandler } from '../types';
import { getRandomHexColor, calculateRatio, formatNumber } from '../utils';

export const duelsHandler: StatsHandler = {
    gameMode: 'Duels',
    command: 'duels',
    description: 'Check Duels stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: Duels): string => {
        if (!stats) {
            return `/gc No Duels stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.wins ?? 0;
        const losses = stats.losses ?? 0;
        const kills = stats.kills ?? 0;
        const deaths = stats.deaths ?? 0;
        const coins = stats.coins ?? 0;

        // Popular duel types
        const uhcWins = stats.uhc_duel_wins ?? 0;
        const swWins = stats.sw_duel_wins ?? 0;
        const classicWins = stats.classic_duel_wins ?? 0;
        const bowWins = stats.bow_wins ?? 0;
        const opWins = stats.op_duel_wins ?? 0;

        // Calculate ratios
        const kdr = calculateRatio(kills, deaths);
        const wlr = calculateRatio(wins, losses);

        return `/gc [Duels] IGN: ${playerName} | WINS: ${wins} | KDR: ${kdr} | KILLS: ${formatNumber(kills)} | WLR: ${wlr} | UHC: ${uhcWins} | SW: ${swWins} | CLASSIC: ${classicWins} | ${getRandomHexColor()}`;
    }
};
