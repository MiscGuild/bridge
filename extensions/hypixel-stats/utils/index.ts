/**
 * Utility functions for Hypixel Stats Extension
 */

import { FetchError, MojangProfile, HypixelPlayerResponse } from '../types';

/**
 * Generate random hex color for chat messages
 */
const getRandomHexColor = (): string => {
    const hex = Math.floor(Math.random() * 0xffffffff)
        .toString(16)
        .padStart(8, '0');
    return `#${hex}`;
};

export { getRandomHexColor }; 

/**
 * Fetch Mojang profile by username
 */
export async function fetchMojangProfile(username: string): Promise<MojangProfile | FetchError> {
    try {
        const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
            headers: {
                'User-Agent': 'MiscellaneousBridge/2.6 (info@vliegenier04.dev)',
                Accept: 'application/json',
            },
        });
        
        if (response.status === 204) {
            return {
                status: 204,
                statusText: 'Player not found'
            };
        }
        
        if (response.status === 200) {
            const data: any = await response.json();
            return { id: data.id, name: data.name };
        }
        
        return {
            status: response.status,
            statusText: response.statusText
        };
    } catch (error) {
        return {
            status: 500,
            statusText: 'Network error'
        };
    }
}

/**
 * Fetch Hypixel player profile
 */
export async function fetchHypixelPlayerProfile(uuid: string, apiKey: string): Promise<HypixelPlayerResponse | FetchError> {
    try {
        const response = await fetch(
            `https://api.hypixel.net/player?key=${apiKey}&uuid=${uuid}`
        );

        if (response.status === 200) {
            const data: any = await response.json();
            if (data && data.player !== null) {
                return data.player as HypixelPlayerResponse;
            }
            return {
                status: 404,
                statusText: 'Player not found on Hypixel'
            };
        }

        return {
            status: response.status,
            statusText: response.statusText
        };
    } catch (error) {
        return {
            status: 500,
            statusText: 'Network error'
        };
    }
}

/**
 * Check if response is a fetch error
 */
export function isFetchError(response: any): response is FetchError {
    return response && typeof response.status === 'number' && typeof response.statusText === 'string';
}

/**
 * Calculate ratio with proper handling of zero denominators
 */
export function calculateRatio(numerator: number, denominator: number, decimals: number = 2): string {
    if (denominator === 0) {
        return numerator.toString();
    }
    return (numerator / denominator).toFixed(decimals);
}

/**
 * Format large numbers with appropriate suffixes
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Get Bedwars star color based on level
 */
export function getBedwarsStarColor(level: number): string {
    if (level >= 3000) return '[' + level + '✫]';
    if (level >= 2000) return '[' + level + '✫]';
    if (level >= 1000) return '[' + level + '✫]';
    if (level >= 900) return '[' + level + '✪]';
    if (level >= 800) return '[' + level + '✪]';
    if (level >= 700) return '[' + level + '✪]';
    if (level >= 600) return '[' + level + '✪]';
    if (level >= 500) return '[' + level + '✪]';
    if (level >= 400) return '[' + level + '✪]';
    if (level >= 300) return '[' + level + '✪]';
    if (level >= 200) return '[' + level + '✪]';
    if (level >= 100) return '[' + level + '✪]';
    return '[' + level + '✪]';
}

/**
 * Get SkyWars level color and formatting
 */
export function getSkywarsLevelColor(level: number): string {
    if (level >= 60) return '[' + level + '✪]';
    if (level >= 50) return '[' + level + '✪]';
    if (level >= 40) return '[' + level + '✪]';
    if (level >= 30) return '[' + level + '✪]';
    if (level >= 20) return '[' + level + '✪]';
    if (level >= 10) return '[' + level + '✪]';
    if (level >= 5) return '[' + level + '✪]';
    return '[' + level + ']';
}
