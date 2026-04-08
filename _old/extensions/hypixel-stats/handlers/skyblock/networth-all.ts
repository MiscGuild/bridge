/**
 * Networth Handlers
 */

import { Achievements, SkyBlock, StatsHandler } from '../../types';
import {
    getRandomHexColor,
    fetchSkyblockProfiles,
    fetchMojangProfile,
    isFetchError,
} from '../../utils';

// Import the networth library
let ProfileNetworthCalculator: any;
try {
    const skyhelperNetworth = require('skyhelper-networth');
    ProfileNetworthCalculator = skyhelperNetworth.ProfileNetworthCalculator;
} catch (error) {
    console.error('SkyHelper-Networth library not found:', error);
}

async function calculateCategoryNetworth(
    playerName: string,
    category: string,
    api?: any
): Promise<string> {
    if (!ProfileNetworthCalculator) {
        return `${playerName} ${category}: Library unavailable | ${getRandomHexColor()}`;
    }

    try {
        const apiKey = api?.config?.hypixelApiKey || process.env.HYPIXEL_API_KEY;
        if (!apiKey) {
            return `${playerName} ${category}: API key not configured | ${getRandomHexColor()}`;
        }

        const mojangResponse = await fetchMojangProfile(playerName);
        if (isFetchError(mojangResponse)) {
            return `${playerName} ${category}: Player not found | ${getRandomHexColor()}`;
        }

        const profileResponse = await fetchSkyblockProfiles(mojangResponse.id, apiKey);
        if (isFetchError(profileResponse)) {
            return `${playerName} ${category}: No SkyBlock data | ${getRandomHexColor()}`;
        }

        const networthCalculator = new ProfileNetworthCalculator(
            profileResponse.memberData,
            undefined,
            profileResponse.bankBalance
        );
        const networthResult = await networthCalculator.getNetworth();

        if (!networthResult?.types) {
            return `${playerName} ${category}: Unable to calculate | ${getRandomHexColor()}`;
        }

        const categoryData = networthResult.types[category.toLowerCase()];
        const value = Math.floor(categoryData?.total || 0);
        const count = categoryData?.items?.length || 0;

        const formatNumber = (num: number): string => {
            if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
            if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
            if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
            return num.toLocaleString();
        };

        return `${playerName} ${category}: ${formatNumber(value)} coins | ${count} items | ${getRandomHexColor()}`;
    } catch (error) {
        return `${playerName} ${category}: Error calculating | ${getRandomHexColor()}`;
    }
}

export const networthArmorHandler: StatsHandler = {
    gameMode: 'Networth Armor',
    command: 'networth armor',
    description: 'Check armor networth',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: SkyBlock,
        api?: any
    ) => calculateCategoryNetworth(playerName, 'Armor', api),
};

export const networthWardrobeHandler: StatsHandler = {
    gameMode: 'Networth Wardrobe',
    command: 'networth wardrobe',
    description: 'Check wardrobe networth',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: SkyBlock,
        api?: any
    ) => calculateCategoryNetworth(playerName, 'Wardrobe', api),
};

export const networthInventoryHandler: StatsHandler = {
    gameMode: 'Networth Inventory',
    command: 'networth inventory',
    description: 'Check inventory networth',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: SkyBlock,
        api?: any
    ) => calculateCategoryNetworth(playerName, 'Inventory', api),
};

export const networthStorageHandler: StatsHandler = {
    gameMode: 'Networth Storage',
    command: 'networth storage',
    description: 'Check storage networth',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: SkyBlock,
        api?: any
    ) => calculateCategoryNetworth(playerName, 'Storage', api),
};

export const networthEquipmentHandler: StatsHandler = {
    gameMode: 'Networth Equipment',
    command: 'networth equipment',
    description: 'Check equipment networth',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: SkyBlock,
        api?: any
    ) => calculateCategoryNetworth(playerName, 'Equipment', api),
};

export const networthEnderchestHandler: StatsHandler = {
    gameMode: 'Networth Enderchest',
    command: 'networth enderchest',
    description: 'Check enderchest networth',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: SkyBlock,
        api?: any
    ) => calculateCategoryNetworth(playerName, 'Enderchest', api),
};

export const networthPetsHandler: StatsHandler = {
    gameMode: 'Networth Pets',
    command: 'networth pets',
    description: 'Check pets networth',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: SkyBlock,
        api?: any
    ) => calculateCategoryNetworth(playerName, 'Pets', api),
};
