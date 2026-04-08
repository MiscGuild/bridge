/**
 * Arcade Stats Handler
 */

import { Achievements, Arcade, StatsHandler } from '../types';
import { getRandomHexColor, formatNumber } from '../utils';

export const arcadeHandler: StatsHandler = {
    gameMode: 'Arcade',
    command: 'arcade',
    description: 'Check Arcade Games stats',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: Arcade
    ): string => {
        if (!stats) {
            return `No Arcade Games stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        // Calculate total wins by summing all specific arcade game wins
        const totalWins =
            (stats.wins_party ?? 0) +
            (stats.wins_hole_in_the_wall ?? 0) +
            (stats.wins_galaxy_wars ?? 0) +
            (stats.wins_dragonwars2 ?? 0) +
            (stats.wins_dayone ?? 0) +
            (stats.wins_simon_says ?? 0) +
            (stats.wins_santa_says ?? 0) +
            (stats.wins_mini_walls ?? 0) +
            (stats.wins_farm_hunt ?? 0) +
            (stats.wins_creeper_attack ?? 0) +
            (stats.wins_throw_out ?? 0) +
            (stats.wins_easter_simulator ?? 0) +
            (stats.wins_scuba_simulator ?? 0) +
            (stats.wins_halloween_simulator ?? 0) +
            (stats.wins_grinch_simulator ?? 0) +
            (stats.wins_grinch_simulator_v2 ?? 0) +
            (stats.wins_ender ?? 0) +
            (stats.wins_soccer ?? 0) +
            (stats.wins_zombies ?? 0) +
            (stats.wins_zombies_deadend ?? 0) +
            (stats.wins_zombies_deadend_normal ?? 0) +
            (stats.wins_zombies_prison ?? 0) +
            (stats.wins_zombies_prison_normal ?? 0) +
            (stats.wins_oneinthequiver ?? 0) +
            (stats.pixel_party?.wins ?? 0) +
            (stats.pixel_party?.wins_normal ?? 0) +
            (stats.pixel_party?.wins_hyper ?? 0);

        const coins = stats.coins ?? 0;
        const partyWins = stats.wins_party ?? 0;
        const holeInTheWallWins = stats.wins_hole_in_the_wall ?? 0;
        const galaxyWarsWins = stats.wins_galaxy_wars ?? 0;
        const dragonWarsWins = stats.wins_dragonwars2 ?? 0;
        const miniWallsWins = stats.wins_mini_walls ?? 0;
        const farmHuntWins = stats.wins_farm_hunt ?? 0;

        return `[Arcade] IGN: ${playerName} | WINS: ${totalWins} | COINS: ${formatNumber(coins)} | PARTY: ${partyWins} | HITW: ${holeInTheWallWins} | GALAXY: ${galaxyWarsWins} | DRAGON: ${dragonWarsWins} | MINIWALLS: ${miniWallsWins} | FARM: ${farmHuntWins} | ${getRandomHexColor()}`;
    },
};
