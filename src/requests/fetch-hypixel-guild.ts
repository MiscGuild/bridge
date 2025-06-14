import env from '../util/env';
import { FetchError } from '../util/fetchError';

export interface HypixelGuildResponse {
    _id: string;
    name: string;
    coins: number;
    memberSizeLevel: number;
    bankSizeLevel: number;
    coinsEver: number;
    created: number;
    members: Member[];
    canParty: boolean;
    canTag: boolean;
    tag?: string;
    banner?: Banner;
    canMotd?: boolean;
    vipCount?: number;
    mvpCount?: number;
    tagColor?: string;
}

export interface Member {
    uuid: string;
    rank: string;
    joined: number;
    expHistory: { [key: number]: number };
}

interface Banner {
    Base?: string;
    Patterns?: Pattern[];
}

interface Pattern {
    Pattern?: string;
    Color?: string | number;
}

export default async function fetchHypixelGuild(
    uuid: string
): Promise<HypixelGuildResponse | FetchError> {
    try {
        const response = await fetch(
            `https://api.hypixel.net/guild?key=${env.HYPIXEL_API_KEY}&player=${uuid}`
        );

        if (!response.ok) {
            const text = await response.text();
            return {
                error: 'Hypixel API error',
                status: response.status,
                statusText: response.statusText,
                details: text,
            };
        }

        const data = await response.json();
        return data.guild as HypixelGuildResponse;
    } catch (err) {
        return {
            error: 'Network error or invalid JSON',
            statusText: 'Fetch failed',
            details: err,
        };
    }
}
