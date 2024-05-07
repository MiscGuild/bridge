import fetchHypixelPlayerProfile from '@util/requests/fetch-hypixel-player-profile';
import fetchMojangProfile from '@util/requests/fetch-mojang-profile';
import isFetchError from '@util/requests/is-fetch-error';
import isUserBlacklisted from '@util/blacklist/is-user-blacklisted';

export default {
    name: 'chat:joinRequest',
    runOnce: false,
    run: async (bot, playerName: string) => {
        const mojangProfile = await fetchMojangProfile(playerName);
        if (isFetchError(mojangProfile)) return;

        const playerProfile = await fetchHypixelPlayerProfile(playerName);
        if (!isFetchError(playerProfile)) {
            const networkLevel = Math.sqrt(2 * playerProfile.networkExp! + 30625) / 50 - 2.5;

            if (networkLevel < parseFloat(process.env.MINIMUM_NETWORK_LEVEL)) {
                bot.sendGuildMessage(
                    'oc',
                    `The player ${playerName} is not network level ${process.env.MINIMUM_NETWORK_LEVEL}!`
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
