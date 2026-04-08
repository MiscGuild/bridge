/**
 * Mega Walls Stats Handler
 */

import { Achievements, Walls3, StatsHandler } from '../types';
import { getRandomHexColor, calculateRatio } from '../utils';

export const megaWallsHandler: StatsHandler = {
    gameMode: 'Walls3',
    command: 'mw',
    description: 'Check Mega Walls stats',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: Walls3
    ): string => {
        if (!stats) {
            return `No Mega Walls stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.wins ?? 0;
        const losses = stats.losses ?? 0;
        const kills = stats.kills ?? 0;
        const deaths = stats.deaths ?? 0;
        const finalKills = stats.final_kills ?? 0;
        const finalDeaths = stats.final_deaths ?? 0;
        const chosenClass = stats.chosen_class ?? 'Unknown';

        // Calculate ratios
        const kdr = calculateRatio(kills, deaths);
        const wlr = calculateRatio(wins, losses);
        const fkdr = calculateRatio(finalKills, finalDeaths);

        return `[Mega Walls] IGN: ${playerName} | WINS: ${wins} | KDR: ${kdr} | FKDR: ${fkdr} | WLR: ${wlr} | FK: ${finalKills} | CLASS: ${chosenClass} | ${getRandomHexColor()}`;
    },
};
