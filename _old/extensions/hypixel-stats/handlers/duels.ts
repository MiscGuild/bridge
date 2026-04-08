/**
 * Duels Stats Handlers - Multiple Game Modes
 */

import { Achievements, Duels, StatsHandler } from '../types';
import { getRandomHexColor, calculateRatio, formatNumber } from '../utils';

// General Duels Handler
export const duelsHandler: StatsHandler = {
    gameMode: 'Duels',
    command: 'duels',
    description: 'Check overall Duels stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: Duels): string => {
        if (!stats) {
            return `No Duels stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.wins ?? 0;
        const losses = stats.losses ?? 0;
        const kills = stats.kills ?? 0;
        const deaths = stats.deaths ?? 0;

        // Calculate ratios
        const kdr = calculateRatio(kills, deaths);
        const wlr = calculateRatio(wins, losses);

        return `[Duels] IGN: ${playerName} | WINS: ${wins} | KDR: ${kdr} | KILLS: ${formatNumber(kills)} | WLR: ${wlr} | ${getRandomHexColor()}`;
    },
};

// UHC Duels Handler
export const uhcDuelsHandler: StatsHandler = {
    gameMode: 'Duels',
    command: 'uhcduels',
    description: 'Check UHC Duels stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: Duels): string => {
        if (!stats) {
            return `No UHC Duels stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.uhc_duel_wins ?? 0;
        const losses = stats.uhc_duel_losses ?? 0;
        const totalKills = stats.kills ?? 0;
        const totalDeaths = stats.deaths ?? 0;

        const kdr = calculateRatio(totalKills, totalDeaths);
        const wlr = calculateRatio(wins, losses);

        return `[UHC Duels] IGN: ${playerName} | WINS: ${wins} | LOSSES: ${losses} | WLR: ${wlr} | Overall KDR: ${kdr} | ${getRandomHexColor()}`;
    },
};

// SkyWars Duels Handler
export const swDuelsHandler: StatsHandler = {
    gameMode: 'Duels',
    command: 'swduels',
    description: 'Check SkyWars Duels stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: Duels): string => {
        if (!stats) {
            return `No SkyWars Duels stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.sw_duel_wins ?? 0;
        const losses = stats.sw_duel_losses ?? 0;
        const totalKills = stats.kills ?? 0;
        const totalDeaths = stats.deaths ?? 0;

        const kdr = calculateRatio(totalKills, totalDeaths);
        const wlr = calculateRatio(wins, losses);

        return `[SkyWars Duels] IGN: ${playerName} | WINS: ${wins} | LOSSES: ${losses} | WLR: ${wlr} | Overall KDR: ${kdr} | ${getRandomHexColor()}`;
    },
};

// Classic Duels Handler
export const classicDuelsHandler: StatsHandler = {
    gameMode: 'Duels',
    command: 'classicduels',
    description: 'Check Classic Duels stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: Duels): string => {
        if (!stats) {
            return `No Classic Duels stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.classic_duel_wins ?? 0;
        const losses = stats.classic_duel_losses ?? 0;
        const totalKills = stats.kills ?? 0;
        const totalDeaths = stats.deaths ?? 0;

        const kdr = calculateRatio(totalKills, totalDeaths);
        const wlr = calculateRatio(wins, losses);

        return `[Classic Duels] IGN: ${playerName} | WINS: ${wins} | LOSSES: ${losses} | WLR: ${wlr} | Overall KDR: ${kdr} | ${getRandomHexColor()}`;
    },
};

// Bow Duels Handler
export const bowDuelsHandler: StatsHandler = {
    gameMode: 'Duels',
    command: 'bowduels',
    description: 'Check Bow Duels stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: Duels): string => {
        if (!stats) {
            return `No Bow Duels stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.bow_wins ?? 0;
        const losses = stats.bow_losses ?? 0;
        const totalKills = stats.kills ?? 0;
        const totalDeaths = stats.deaths ?? 0;

        const kdr = calculateRatio(totalKills, totalDeaths);
        const wlr = calculateRatio(wins, losses);

        return `[Bow Duels] IGN: ${playerName} | WINS: ${wins} | LOSSES: ${losses} | WLR: ${wlr} | Overall KDR: ${kdr} | ${getRandomHexColor()}`;
    },
};

// OP Duels Handler
export const opDuelsHandler: StatsHandler = {
    gameMode: 'Duels',
    command: 'opduels',
    description: 'Check OP Duels stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: Duels): string => {
        if (!stats) {
            return `No OP Duels stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.op_duel_wins ?? 0;
        const losses = stats.op_duel_losses ?? 0;
        const totalKills = stats.kills ?? 0;
        const totalDeaths = stats.deaths ?? 0;

        const kdr = calculateRatio(totalKills, totalDeaths);
        const wlr = calculateRatio(wins, losses);

        return `[OP Duels] IGN: ${playerName} | WINS: ${wins} | LOSSES: ${losses} | WLR: ${wlr} | Overall KDR: ${kdr} | ${getRandomHexColor()}`;
    },
};

// Combo Duels Handler
export const comboDuelsHandler: StatsHandler = {
    gameMode: 'Duels',
    command: 'comboduels',
    description: 'Check Combo Duels stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: Duels): string => {
        if (!stats) {
            return `No Combo Duels stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.combo_duel_wins ?? 0;
        const losses = stats.combo_duel_losses ?? 0;
        const totalKills = stats.kills ?? 0;
        const totalDeaths = stats.deaths ?? 0;

        const kdr = calculateRatio(totalKills, totalDeaths);
        const wlr = calculateRatio(wins, losses);

        return `[Combo Duels] IGN: ${playerName} | WINS: ${wins} | LOSSES: ${losses} | WLR: ${wlr} | Overall KDR: ${kdr} | ${getRandomHexColor()}`;
    },
};

// Potion Duels Handler
export const potionDuelsHandler: StatsHandler = {
    gameMode: 'Duels',
    command: 'potionduels',
    description: 'Check Potion Duels stats',
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: Duels): string => {
        if (!stats) {
            return `No Potion Duels stats found for ${playerName}. | ${getRandomHexColor()}`;
        }

        const wins = stats.potion_duel_wins ?? 0;
        const losses = stats.potion_duel_losses ?? 0;
        const totalKills = stats.kills ?? 0;
        const totalDeaths = stats.deaths ?? 0;

        const kdr = calculateRatio(totalKills, totalDeaths);
        const wlr = calculateRatio(wins, losses);

        return `[Potion Duels] IGN: ${playerName} | WINS: ${wins} | LOSSES: ${losses} | WLR: ${wlr} | Overall KDR: ${kdr} | ${getRandomHexColor()}`;
    },
};
