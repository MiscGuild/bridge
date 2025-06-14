import getRandomHexColor from './getRandomHexColor';
import { isOnCooldown, setCooldown } from './isOnCooldown';
import { isFetchError, handleFetchError } from './fetchError';
import fetchMojangProfile from '../requests/fetch-mojang-profile';
import fetchHypixelGuild from '../requests/fetch-hypixel-guild';

type ExpHistory = Record<string, number>;

export default async function handleGuildCommand(
    bot: any,
    channel: string,
    playerRank: string,
    playerName: string,
    guildRank: string,
    target: string,
    buildGEXPMessage: (
        runChannel: string,
        requestName: string,
        lookupName: string,
        guildGEXP: string | number[]
    ) => string
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

    const requestName = playerName || 'Unknown Player';
    const lookupName = target && target.trim() !== '' ? target.trim() : playerName;

    const mojangProfile = await fetchMojangProfile(lookupName);

    if (isFetchError(mojangProfile)) {
        handleFetchError(mojangProfile, playerName, target, bot);
        return;
    }

    const uuid = mojangProfile.id;
    if (!uuid) {
        bot.sendToChannel(channel, `Could not find a UUID for "${target}".`);
        return;
    }

    const guild = await fetchHypixelGuild(uuid);
    if (isFetchError(guild)) {
        handleFetchError(guild, playerName, target, bot);
        return;
    }

    if (!guild) {
        bot.executeCommand(
            `/gc ${playerName}, the player ${target} is not in a guild. | ${getRandomHexColor()}`
        );
        return;
    }

    if (guild.members.length === 0) {
        bot.executeCommand(
            `/gc ${playerName}, the guild of ${target} has no members. | ${getRandomHexColor()}`
        );
        return;
    }

    let playerGEXP: string | number[] = 'No GEXP data found';

    const guildMember = guild.members.find((m) => m.uuid === uuid);
    if (guildMember?.expHistory && typeof guildMember.expHistory === 'object') {
        const history = guildMember.expHistory as ExpHistory;
        const sortedGEXP = Object.keys(history)
            .sort()
            .map((date) => history[date] ?? 0);

        playerGEXP = sortedGEXP;
    }

    let runChannel: string;

    if (channel.includes('From')) {
        runChannel = 'w';
    } else if (channel.includes('Guild')) {
        runChannel = 'gc';
    } else if (channel.includes('Officer')) {
        runChannel = 'oc';
    } else {
        runChannel = 'gc'; // fallback default
    }

    const message = buildGEXPMessage(runChannel, requestName, lookupName, playerGEXP);
    bot.executeCommand(message);
}
