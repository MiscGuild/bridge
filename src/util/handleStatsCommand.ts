import getRandomHexColor from './getRandomHexColor';
import { isOnCooldown, setCooldown } from './isOnCooldown';
import fetchHypixelPlayerProfile, { Stats } from '../requests/fetch-hypixel-player-profile';
import isFetchError from '../requests/is-fetch-error';
import handleFetchError from './fetchingError';
import fetchMojangProfile from '../requests/fetch-mojang-profile';

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

    const lookupName = target && target.trim() !== '' ? target.trim() : playerName;
    const profile = await fetchMojangProfile(lookupName);

    let playerData: any;
    if ('id' in profile && typeof profile.id === 'string' && profile.id.length === 32) {
        playerData = await fetchHypixelPlayerProfile(profile.id);
    } else {
        playerData = await fetchHypixelPlayerProfile(lookupName);
    }
    if (isFetchError(playerData)) {
        handleFetchError(playerData, playerName, lookupName, bot);
        return;
    }

    const gameStats = playerData?.stats?.[gameModeKey];
    const achievements = playerData?.achievements;

    if (gameStats && achievements) {
        const message = buildStatsMessage(lookupName, achievements, gameStats);
        bot.executeCommand(message);
    } else {
        bot.executeCommand(
            `/gc ${playerName}, No ${gameModeKey} stats found for ${lookupName}. | ${getRandomHexColor()}`
        );
    }
}
