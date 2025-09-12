/**
 * Arcade Stats Handler
 */

import { Achievements, Arcade, StatsHandler } from '../types';
import { getRandomHexColor, formatNumber } from '../utils';

export const arcadeHandler: StatsHandler = {
    gameMode: 'Arcade',
    command: 'arcade',
    description: 'Check Arcade Games stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: Arcade): string => {
        if (!stats) {
            return `/gc No Arcade Games stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.wins ?? 0;
        const coins = stats.coins ?? 0;
        const partyWins = stats.wins_party ?? 0;
        const holeInTheWallWins = stats.wins_hole_in_the_wall ?? 0;
        const galaxyWarsWins = stats.wins_galaxy_wars ?? 0;
        const dragonWarsWins = stats.wins_dragonwars2 ?? 0;
        const miniWallsWins = stats.wins_mini_walls ?? 0;
        const farmHuntWins = stats.wins_farm_hunt ?? 0;

        return `/gc [Arcade] IGN: ${playerName} | WINS: ${wins} | COINS: ${formatNumber(coins)} | PARTY: ${partyWins} | HITW: ${holeInTheWallWins} | GALAXY: ${galaxyWarsWins} | DRAGON: ${dragonWarsWins} | ${getRandomHexColor()}`;
    }
};
