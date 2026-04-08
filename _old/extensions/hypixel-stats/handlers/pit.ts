/**
 * Pit Stats Handler
 */

import { Achievements, Pit, StatsHandler } from '../types';
import { getRandomHexColor, calculateRatio, formatNumber } from '../utils';

export const pitHandler: StatsHandler = {
    gameMode: 'Pit',
    command: 'pit',
    description: 'Check Pit stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: Pit): string => {
        if (!stats) {
            return `No Pit stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        // Get profile data
        const profile = stats.profile || {};

        const kills = profile.kills ?? 0;
        const deaths = profile.deaths ?? 0;
        const assists = profile.assists ?? 0;
        const prestige = profile.prestige ?? 0;
        const level = profile.level ?? 0;
        const gold = profile.cash ?? 0;

        // Calculate KDR
        const kdr = calculateRatio(kills, deaths);

        return `[Pit] IGN: ${playerName} | Prestige: ${prestige} | Level: ${level} | KILLS: ${formatNumber(kills)} | KDR: ${kdr} | ASSISTS: ${formatNumber(assists)} | GOLD: ${formatNumber(gold)} | ${getRandomHexColor()}`;
    },
};
