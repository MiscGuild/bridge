import getRandomHexColor from './getRandomHexColor';
import { isOnCooldown, setCooldown } from './isOnCooldown';
import fetchHypixelPlayerProfile, { Stats } from '../requests/fetch-hypixel-player-profile';
import fetchMojangProfile from '../requests/fetch-mojang-profile';
import { isFetchError, handleFetchError } from './fetchError';

type GameModeKey = keyof Stats;

export default async function handleStatsCommand(
    bot: any,
    channel: string,
    playerRank: string,
    playerName: string,
    guildRank: string,
    target: string,
    gameModeKey: GameModeKey,
    buildStatsMessage: (lookupName: string, achievements: any, stats: any) => string
) {
    const now = Date.now();
    const cooldown = isOnCooldown(playerName, guildRank, now);

    if (cooldown !== null) {
        bot.executeCommand(
            `/gc ${playerName}, you can only use this command again in ${cooldown} seconds. Please wait. | ${getRandomHexColor()}`
        );
        return;
    }

    setCooldown(playerName, now);

    const lookupName = target?.trim() || playerName;
    const profile = await fetchMojangProfile(lookupName);

    if (isFetchError(profile)) {
        handleFetchError(profile, playerName, lookupName, bot);
        return;
    }

    const playerData = await fetchHypixelPlayerProfile(profile.id);

    if (isFetchError(playerData)) {
        handleFetchError(playerData, playerName, lookupName, bot);
        return;
    }

    if ('stats' in playerData && 'achievements' in playerData) {
        const gameStats = playerData.stats?.[gameModeKey];
        const { achievements } = playerData;

        if (gameStats && achievements) {
            const message = buildStatsMessage(lookupName, achievements, gameStats);
            bot.executeCommand(message);
        } else {
            bot.executeCommand(
                `/gc ${playerName}, No ${gameModeKey} stats found for ${lookupName}. | ${getRandomHexColor()}`
            );
        }
    } else {
        bot.executeCommand(
            `/gc ${playerName}, Unable to retrieve stats for ${lookupName}. | ${getRandomHexColor()}`
        );
    }
}
