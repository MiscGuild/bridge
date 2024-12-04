import fetchHypixelGuild from '@requests/fetch-hypixel-guild';
import fetchMojangProfile from '@requests/fetch-mojang-profile';
import isFetchError from '@requests/is-fetch-error';

export default {
    name: 'chat:whisper',
    runOnce: false,
    run: async (bridge, playerName: string, message: string) => {
        const errorMessage = `/w ${playerName} There was an error attempting your request! (Check spelling and/or try again later)`;
        const target = message.startsWith('weeklygexp')
            ? playerName
            : (message.split(' ')[0] as string);

        const mojangProfile = await fetchMojangProfile(target);
        if (isFetchError(mojangProfile)) {
            bridge.mineflayer.execute(errorMessage);
            return;
        }

        const playerGuild = await fetchHypixelGuild(mojangProfile.id);
        if (isFetchError(playerGuild)) {
            bridge.mineflayer.execute(errorMessage);
            return;
        }

        const data = playerGuild.members.find((member) => member.uuid === mojangProfile.id);
        const gexp = Object.values(data!.expHistory).reduce((total, day) => total + day);

        bridge.mineflayer.execute(
            `/w ${playerName} ${target}'s total weekly gexp: ${gexp.toLocaleString()}`
        );
    },
} as BotEvent;
