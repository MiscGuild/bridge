import isUserBlacklisted from '../../../blacklist/is-user-blacklisted';
import env from '../../../util/env';
import fetchHypixelPlayerProfile from '../../../requests/fetch-hypixel-player-profile';
import fetchMojangProfile from '../../../requests/fetch-mojang-profile';
import isFetchError from '../../../requests/is-fetch-error';

export default {
    name: 'chat:joinRequest',
    runOnce: false,
    run: async (bot, playerName: string) => {
        const mojangProfile = await fetchMojangProfile(playerName);
        if (isFetchError(mojangProfile)) return;

        const playerProfile = await fetchHypixelPlayerProfile(playerName);
        if (!isFetchError(playerProfile)) {
            const networkLevel = Math.sqrt(2 * playerProfile.networkExp! + 30625) / 50 - 2.5;

            if (networkLevel < env.MINIMUM_NETWORK_LEVEL) {
                bot.sendGuildMessage(
                    'oc',
                    `The player ${playerName} is not network level ${env.MINIMUM_NETWORK_LEVEL}!`
                );
            }
        }

        if (isUserBlacklisted(mojangProfile.id)) {
            bot.sendGuildMessage(
                'oc',
                `The player ${playerName} is blacklisted. Do NOT accept their join request.`
            );
        }
    },
} as Event;
