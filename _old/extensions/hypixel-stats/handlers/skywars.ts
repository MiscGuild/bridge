/**
 * SkyWars Stats Handler
 */

import { Achievements, SkyWars, StatsHandler } from '../types';
import {
    getRandomHexColor,
    calculateRatio,
    getSkywarsLevelColor,
    formatNumber,
    calculateSkywarsLevel,
} from '../utils';

export const skywarsHandler: StatsHandler = {
    gameMode: 'SkyWars',
    command: 'sw',
    description: 'Check SkyWars stats',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: SkyWars
    ): string => {
        if (!stats) {
            return `No SkyWars stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        // Calculate level from experience or use direct level value
        const experience = stats.skywars_experience ?? stats.experience ?? 0;
        const level =
            experience > 0
                ? calculateSkywarsLevel(experience)
                : (stats.level ?? achievements?.skywars_level ?? 0);
        const wins = stats.wins ?? 0;
        const losses = stats.losses ?? 0;
        const kills = stats.kills ?? 0;
        const deaths = stats.deaths ?? 0;
        const souls = stats.souls ?? 0;

        // Calculate ratios
        const kdr = calculateRatio(kills, deaths);
        const wlr = calculateRatio(wins, losses);

        const levelDisplay = getSkywarsLevelColor(level);

        return `[SkyWars] IGN: ${playerName} | ${levelDisplay} | WINS: ${wins} | KDR: ${kdr} | KILLS: ${formatNumber(kills)} | WLR: ${wlr} | SOULS: ${formatNumber(souls)} | ${getRandomHexColor()}`;
    },
};
