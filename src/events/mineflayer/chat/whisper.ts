import fetchHypixelGuild from '@requests/fetch-hypixel-guild';
import fetchMojangProfile from '@requests/fetch-mojang-profile';
import isFetchError from '@requests/is-fetch-error';

export default {
    name: 'chat:whisper',
    runOnce: false,
    run: async (bot, playerName: string, message: string) => {
        const errorMessage = `/w ${playerName} There was an error attempting your request! (Check spelling and/or try again later)`;
        const target = message.startsWith('weeklygexp' || 'weeklygxp')
            ? playerName
            : (message.split(' ')[0] as string);

        const mojangProfile = await fetchMojangProfile(target);
        if (isFetchError(mojangProfile)) {
            bot.executeCommand(errorMessage);
            return;
        }

        const playerGuild = await fetchHypixelGuild(mojangProfile.id);
        if (isFetchError(playerGuild)) {
            bot.executeCommand(errorMessage);
            return;
        }

        const member = playerGuild.members.find(
            (guildMember) => guildMember.uuid === mojangProfile.id
        );

        const gexp = Object.values(member!.expHistory).reduce(
            (previous, current) => previous + current
        );

        bot.executeCommand(
            `/w ${playerName} ${target}'s total weekly gexp: ${gexp.toLocaleString()}`
        );
    },
} as Event;
