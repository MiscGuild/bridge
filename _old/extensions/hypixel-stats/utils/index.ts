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
        const response = await fetch(
            `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`,
            {
                headers: {
                    'User-Agent': 'MiscellaneousBridge/2.6 (info@vliegenier04.dev)',
                    Accept: 'application/json',
                },
            }
        );

        if (response.status === 204) {
            return {
                status: 204,
                statusText: 'Player not found',
            };
        }

        if (response.status === 200) {
            const data: any = await response.json();
            // Remove dashes from UUID for consistency
            const uuid = data.id.replace(/-/g, '');
            return { id: uuid, name: data.name };
        }

        return {
            status: response.status,
            statusText: response.statusText,
        };
    } catch (error) {
        return {
            status: 500,
            statusText: 'Network error',
        };
    }
}

/**
 * Fetch Hypixel player profile
 */
export async function fetchHypixelPlayerProfile(
    uuid: string,
    apiKey: string
): Promise<HypixelPlayerResponse | FetchError> {
    try {
        const response = await fetch(`https://api.hypixel.net/player?key=${apiKey}&uuid=${uuid}`);

        if (response.status === 200) {
            const data: any = await response.json();
            if (data && data.player !== null) {
                return data.player as HypixelPlayerResponse;
            }
            return {
                status: 404,
                statusText: 'Player not found on Hypixel',
            };
        }

        return {
            status: response.status,
            statusText: response.statusText,
        };
    } catch (error) {
        return {
            status: 500,
            statusText: 'Network error',
        };
    }
}

/**
 * Check if response is a fetch error
 */
export function isFetchError(response: any): response is FetchError {
    return (
        response && typeof response.status === 'number' && typeof response.statusText === 'string'
    );
}

/**
 * Calculate ratio with proper handling of zero denominators
 */
export function calculateRatio(
    numerator: number,
    denominator: number,
    decimals: number = 2
): string {
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
 * Calculate SkyWars level from experience
 * Formula: Each level requires: experience/levels[xp_requirement]
 */
export function calculateSkywarsLevel(exp: number): number {
    // SkyWars XP per level
    const xps = [0, 20, 70, 150, 250, 500, 1000, 2000, 3500, 6000, 10000, 15000];

    if (exp >= 15000) {
        return Math.floor((exp - 15000) / 10000 + 12);
    }

    let level = 0;
    for (let i = 0; i < xps.length; i++) {
        if (exp < xps[i]) {
            return level;
        }
        level = i;
    }

    return level;
}

/**
 * Get SkyWars level color and formatting (stars)
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

/**
 * Fetch SkyBlock profiles for a player
 */
export async function fetchSkyblockProfiles(
    uuid: string,
    apiKey: string
): Promise<any | FetchError> {
    try {
        console.log(`[SkyBlock Debug] Fetching profiles for UUID: ${uuid}`);

        // Step 1: Fetch list of profiles to find the selected one
        const profilesUrl = `https://api.hypixel.net/v2/skyblock/profiles?key=${apiKey}&uuid=${uuid}`;
        console.log(`[SkyBlock Debug] Step 1: Fetching profiles list from /profiles endpoint`);

        const profilesResponse = await fetch(profilesUrl, {
            headers: {
                'User-Agent': 'MiscellaneousBridge/2.6 (info@vliegenier04.dev)',
                Accept: 'application/json',
            },
        });

        console.log(`[SkyBlock Debug] Profiles response status: ${profilesResponse.status}`);

        if (profilesResponse.status !== 200) {
            console.log(
                `[SkyBlock Debug] Failed to fetch profiles: ${profilesResponse.status} - ${profilesResponse.statusText}`
            );
            return {
                status: profilesResponse.status,
                statusText: profilesResponse.statusText,
            };
        }

        const profilesData: any = await profilesResponse.json();
        console.log(
            `[SkyBlock Debug] Profiles data success: ${profilesData.success}, profiles count: ${profilesData.profiles?.length || 0}`
        );

        // Handle case where profiles is null or empty
        if (!profilesData.success || !profilesData.profiles || profilesData.profiles.length === 0) {
            console.log(`[SkyBlock Debug] No profiles found or profiles are private`);
            return {
                status: 404,
                statusText: 'Player has not played SkyBlock or profiles are private',
            };
        }

        // Find the selected profile or use the most recently played one
        const selectedProfile =
            profilesData.profiles.find((p: any) => p.selected) ||
            profilesData.profiles.sort(
                (a: any, b: any) => (b.last_save || 0) - (a.last_save || 0)
            )[0];

        console.log(
            `[SkyBlock Debug] Selected profile: ${selectedProfile?.cute_name || 'Unknown'} (ID: ${selectedProfile?.profile_id}, Selected: ${selectedProfile?.selected})`
        );

        if (!selectedProfile || !selectedProfile.profile_id) {
            console.log(`[SkyBlock Debug] No valid profile found in profiles list`);
            return {
                status: 404,
                statusText: 'No valid SkyBlock profile found',
            };
        }

        // Step 2: Fetch the full profile data using the profile ID
        const profileUrl = `https://api.hypixel.net/v2/skyblock/profile?key=${apiKey}&profile=${selectedProfile.profile_id}`;
        console.log(`[SkyBlock Debug] Step 2: Fetching full profile data from /profile endpoint`);

        const profileResponse = await fetch(profileUrl, {
            headers: {
                'User-Agent': 'MiscellaneousBridge/2.6 (info@vliegenier04.dev)',
                Accept: 'application/json',
            },
        });

        console.log(`[SkyBlock Debug] Profile response status: ${profileResponse.status}`);

        if (profileResponse.status !== 200) {
            console.log(
                `[SkyBlock Debug] Failed to fetch full profile: ${profileResponse.status} - ${profileResponse.statusText}`
            );
            return {
                status: profileResponse.status,
                statusText: profileResponse.statusText,
            };
        }

        const profileData: any = await profileResponse.json();
        console.log(
            `[SkyBlock Debug] Profile data success: ${profileData.success}, has profile: ${!!profileData.profile}`
        );

        if (!profileData.success || !profileData.profile) {
            console.log(`[SkyBlock Debug] Profile data is invalid or missing`);
            return {
                status: 404,
                statusText: 'Failed to fetch full profile data',
            };
        }

        // Check if member data exists for this UUID
        const hasMemberData = !!(profileData.profile.members && profileData.profile.members[uuid]);
        console.log(`[SkyBlock Debug] Member data exists: ${hasMemberData}`);

        if (!hasMemberData) {
            console.log(`[SkyBlock Debug] Member data not found for UUID: ${uuid}`);
            console.log(
                `[SkyBlock Debug] Available member UUIDs: ${Object.keys(profileData.profile.members || {}).join(', ')}`
            );
            return {
                status: 404,
                statusText: 'SkyBlock profile exists but member data not found',
            };
        }

        const memberData = profileData.profile.members[uuid];
        const memberDataKeys = Object.keys(memberData || {});
        console.log(
            `[SkyBlock Debug] Successfully fetched member data with ${memberDataKeys.length} top-level keys`
        );
        console.log(
            `[SkyBlock Debug] Member data keys: ${memberDataKeys.slice(0, 10).join(', ')}${memberDataKeys.length > 10 ? '...' : ''}`
        );

        return {
            profile: profileData.profile,
            memberData: memberData,
            bankBalance: profileData.profile.banking?.balance || 0,
        };
    } catch (error) {
        console.error(`[SkyBlock Debug] Error fetching SkyBlock profiles:`, error);
        return {
            status: 500,
            statusText: 'Network error while fetching SkyBlock profiles',
        };
    }
}
