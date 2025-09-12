/**
 * SkyWars Stats Handler
 */

import { Achievements, SkyWars, StatsHandler } from '../types';
import { getRandomHexColor, calculateRatio, getSkywarsLevelColor, formatNumber } from '../utils';

export const skywarsHandler: StatsHandler = {
    gameMode: 'SkyWars',
    command: 'sw',
    description: 'Check SkyWars stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: SkyWars): string => {
        if (!achievements || !stats) {
            return `/gc No SkyWars stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        // Calculate level from experience (Hypixel uses a complex formula)
        const level = achievements.skywars_level ?? 0;
        const wins = stats.wins ?? 0;
        const losses = stats.losses ?? 0;
        const kills = stats.kills ?? 0;
        const deaths = stats.deaths ?? 0;
        const coins = stats.coins ?? 0;
        const souls = stats.souls ?? 0;

        // Solo stats
        const soloWins = (stats.wins_solo_normal ?? 0) + (stats.wins_solo_insane ?? 0);
        const soloKills = (stats.kills_solo_normal ?? 0) + (stats.kills_solo_insane ?? 0);
        const soloDeaths = (stats.deaths_solo_normal ?? 0) + (stats.deaths_solo_insane ?? 0);

        // Team stats
        const teamWins = (stats.wins_team_normal ?? 0) + (stats.wins_team_insane ?? 0);
        const teamKills = (stats.kills_team_normal ?? 0) + (stats.kills_team_insane ?? 0);
        const teamDeaths = (stats.deaths_team_normal ?? 0) + (stats.deaths_team_insane ?? 0);

        // Calculate ratios
        const kdr = calculateRatio(kills, deaths);
        const wlr = calculateRatio(wins, losses);

        const levelDisplay = getSkywarsLevelColor(level);

        return `/gc [SkyWars] IGN: ${playerName} | ${levelDisplay} | WINS: ${wins} | KDR: ${kdr} | KILLS: ${formatNumber(kills)} | WLR: ${wlr} | SOULS: ${formatNumber(souls)} | ${getRandomHexColor()}`;
    }
};
