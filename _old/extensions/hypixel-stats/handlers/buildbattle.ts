/**
 * Build Battle Stats Handler
 */

import { Achievements, BuildBattle, StatsHandler } from '../types';
import { getRandomHexColor, calculateRatio, formatNumber } from '../utils';

export const buildBattleHandler: StatsHandler = {
    gameMode: 'BuildBattle',
    command: 'bb',
    description: 'Check Build Battle stats',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: BuildBattle
    ): string => {
        if (!stats) {
            return `No Build Battle stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.wins ?? 0;
        const gamesPlayed = stats.games_played ?? 0;
        const score = stats.score ?? 0;
        const soloWins = stats.wins_solo_normal ?? 0;
        const teamWins = stats.wins_teams_normal ?? 0;
        const gtbWins = stats.wins_guess_the_build ?? 0;
        const proWins = stats.wins_solo_pro ?? 0;

        // Calculate win rate
        const winRate = calculateRatio(wins, gamesPlayed, 1);

        return `[Build Battle] IGN: ${playerName} | WINS: ${wins} | SCORE: ${formatNumber(score)} | WR: ${winRate}% | SOLO: ${soloWins} | TEAMS: ${teamWins} | GTB: ${gtbWins} | PRO: ${proWins} | ${getRandomHexColor()}`;
    },
};
