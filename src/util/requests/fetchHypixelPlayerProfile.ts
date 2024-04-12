export default async (username: string) => {
    const response = await fetch(
        `https://api.hypixel.net/player?key=${process.env.HYPIXEL_API_KEY}&name=${username}`
    );

    return response.status === 200
        ? (((await response.json()) as any).player as HypixelPlayerResponse)
        : (response as FetchError);
};

/**
 * Attenuated Version of Source: https://github.com/unaussprechlich/hypixel-api-typescript/
 */
interface HypixelPlayerResponse {
    id: string;
    achievementsOneTime?: (string | null[] | null)[] | null;
    channel?: string;
    disguise?: string;
    displayname: string;
    eulaCoins?: boolean;
    firstLogin?: number;
    friendRequests?: null[] | null;
    karma?: number;
    knownAliases?: string[] | null;
    knownAliasesLower?: string[] | null;
    lastLogin?: number;
    mainlobbytutorial?: boolean;
    mostRecentMinecraftVersion?: number;
    mostRecentlyThanked?: string;
    mostRecentlyThankedUuid?: string;
    mostRecentlyTipped?: string;
    mostRecentlyTippedUuid?: string;
    networkExp?: number;
    newClock?: string;
    notifications?: boolean;
    packageRank?: string;
    playername?: string;
    pp?: string;
    spectators_invisible?: boolean;
    testPass?: boolean;
    thanksSent?: number;
    timePlaying?: number;
    uuid?: string;
    vanityTokens?: number;
    wardrobe?: string;
    websiteSet?: boolean;
    gadget?: string;
    friendRequestsUuid?: null[] | null;
    lastEugeneMessage?: number;
    last_survey?: number;
    particleQuality?: string;
    mcVersionRp?: string;

    rankPlusColor?: string;
    lastAdsenseGenerateTime?: number;
    lastClaimedReward?: number;
    totalRewards?: number;
    totalDailyRewards?: number;
    rewardStreak?: number;
    rewardScore?: number;
    rewardHighScore?: number;
    vanityConvertedBoxToday?: number;
    vanityFirstConvertedBox?: number;
    adsense_tokens?: number;
    userLanguage?: string;
}
