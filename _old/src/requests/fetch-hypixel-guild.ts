import env from '../util/env';

export default async (uuid: string) => {
    if (!env.HYPIXEL_API_KEY)
        return { status: 400, statusText: 'Missing Hypixel API key' } as FetchError;

    const response = await fetch(
        `https://api.hypixel.net/guild?key=${env.HYPIXEL_API_KEY}&player=${uuid}`
    );

    return response.status === 200
        ? (((await response.json()) as any).guild as HypixelGuildResponse)
        : (response as FetchError);
};

/**
 * Source: https://github.com/unaussprechlich/hypixel-api-typescript/
 */
interface HypixelGuildResponse {
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

interface Member {
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
