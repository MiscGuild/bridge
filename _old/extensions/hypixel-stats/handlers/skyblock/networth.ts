/**
 * SkyBlock export const skyblockNetworthHandler: SkyBlockHandler = {
    gameMode: 'SkyBlock Networth',
    command: 'sb networth',worth Handler
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

export const skyblockNetworthHandler: StatsHandler = {
    gameMode: 'SkyBlock Networth',
    command: 'sb networth',
    description: 'Check SkyBlock net worth overview',
    buildStatsMessage: async (
        playerName: string,
        achievements?: Achievements,
        stats?: SkyBlock,
        api?: any
    ): Promise<string> => {
        if (!ProfileNetworthCalculator) {
            return `Networth library unavailable. Use !networth subcommands | ${getRandomHexColor()}`;
        }

        try {
            // Get the API key from config
            const apiKey = api?.config?.hypixelApiKey || process.env.HYPIXEL_API_KEY;
            if (!apiKey) {
                return `API key not configured for networth calculation | ${getRandomHexColor()}`;
            }

            // Fetch UUID
            const mojangResponse = await fetchMojangProfile(playerName);
            if (isFetchError(mojangResponse)) {
                return `Player ${playerName} not found | ${getRandomHexColor()}`;
            }

            // Fetch SkyBlock profiles
            const profileResponse = await fetchSkyblockProfiles(mojangResponse.id, apiKey);
            if (isFetchError(profileResponse)) {
                return `No SkyBlock data found for ${playerName} | ${getRandomHexColor()}`;
            }

            // Calculate networth
            const networthCalculator = new ProfileNetworthCalculator(
                profileResponse.memberData,
                undefined, // museum data (optional)
                profileResponse.bankBalance
            );

            const networthResult = await networthCalculator.getNetworth();
            if (!networthResult) {
                return `Unable to calculate networth for ${playerName} | ${getRandomHexColor()}`;
            }

            const total = Math.floor(networthResult.networth || 0);
            const unsoulbound = Math.floor(networthResult.unsoulboundNetworth || 0);
            const purse = Math.floor(networthResult.purse || 0);
            const bank = Math.floor(networthResult.bank || 0);

            // Format numbers
            const formatNumber = (num: number): string => {
                if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
                if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
                if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
                return num.toLocaleString();
            };

            return `[Networth] ${playerName}: ${formatNumber(total)} | Unsoulbound: ${formatNumber(unsoulbound)} | Purse: ${formatNumber(purse)} | Bank: ${formatNumber(bank)} | ${getRandomHexColor()}`;
        } catch (error) {
            console.error('Networth calculation error:', error);
            return `Error calculating networth for ${playerName} | ${getRandomHexColor()}`;
        }
    },
};
