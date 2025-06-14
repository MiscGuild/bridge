import { FetchError } from '../util/fetchError';

export interface MojangProfileResponse {
    readonly id: string;
    readonly name: string;
}

export default async function fetchMojangProfile(
    username: string
): Promise<MojangProfileResponse | FetchError> {
    const primaryUrl = `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(
        username
    )}`;
    const fallbackUrl = `https://api.minecraftservices.com/minecraft/profile/lookup/name/${encodeURIComponent(
        username
    )}`;

    async function fetchProfile(url: string): Promise<MojangProfileResponse | FetchError> {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'MiscellaneousBridge/2.6 (info@vliegenier04.dev)',
                    Accept: 'application/json',
                },
            });

            if (response.status === 204) {
                return {
                    error: 'Username not found',
                    status: 204,
                    statusText: response.statusText,
                };
            }

            if (!response.ok) {
                const text = await response.text();
                return {
                    error: 'API error',
                    status: response.status,
                    statusText: response.statusText,
                    details: text,
                };
            }

            const data = await response.json();
            return data as MojangProfileResponse;
        } catch (err) {
            return {
                error: 'Network error or invalid JSON',
                statusText: 'Fetch failed',
                details: err,
            };
        }
    }

    // Try Mojang first
    const primaryResult = await fetchProfile(primaryUrl);

    // Use fallback only if Mojang failed with status 204 or 4xx/5xx
    if ('error' in primaryResult && primaryResult.status !== 200) {
        const fallbackResult = await fetchProfile(fallbackUrl);
        return fallbackResult;
    }

    return primaryResult;
}
