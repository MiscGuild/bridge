/**
 * TNT Games Stats Handler
 */

import { Achievements, TNTGames, StatsHandler } from '../types';
import { getRandomHexColor } from '../utils';

export const tntGamesHandler: StatsHandler = {
    gameMode: 'TNTGames',
    command: 'tnt',
    description: 'Check TNT Games stats',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: TNTGames
    ): string => {
        if (!stats) {
            return `No TNT Games stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.wins ?? 0;
        const tntrunWins = stats.wins_tntrun ?? 0;
        const pvprunWins = stats.wins_pvprun ?? 0;
        const bowspleefWins = stats.wins_bowspleef ?? 0;
        const tntagWins = stats.wins_tntag ?? 0;
        const record = stats.record_tntrun ?? 0;

        return `[TNT Games] IGN: ${playerName} | WINS: ${wins} | TNT RUN: ${tntrunWins} | PVP RUN: ${pvprunWins} | BOW SPLEEF: ${bowspleefWins} | TNT TAG: ${tntagWins} | RECORD: ${record}s | ${getRandomHexColor()}`;
    },
};
