import getRandomHexColor from '../../../../util/getRandomHexColor';
import handleGuildCommand from '../../../../util/handleGuildCommand';

function buildGEXPMessage(
    runChannel: string,
    requestName: string,
    lookupName: string,
    playerGEXP: any
): string {
    const playerGEXPAccumulated = playerGEXP.reduce((acc: any, curr: any) => acc + curr, 0);

    // Cycle through 4 different messages, start with the first one. If the response is "Cannot say that message twice!", the next message will be used.
    if (playerGEXPAccumulated === 0) {
        return `/${runChannel} ${requestName} No GEXP stats found for ${lookupName}. Make sure the player has been active in the past 7 days. | ${getRandomHexColor()}`;
    } else if (playerGEXPAccumulated < 1000) {
        return `/${runChannel} ${requestName} ${lookupName} has a total of ${playerGEXPAccumulated} GEXP accumulated over the past 7 days. Keep grinding! | ${getRandomHexColor()}`;
    } else if (playerGEXPAccumulated < 10000) {
        return `/${runChannel} ${requestName} Great job, ${lookupName}! You've accumulated ${playerGEXPAccumulated} GEXP over the past week. Keep it up! | ${getRandomHexColor()}`;
    } else if (playerGEXPAccumulated < 100000) {
        return `/${runChannel} ${requestName} Impressive, ${lookupName}! You've racked up ${playerGEXPAccumulated} GEXP in the last 7 days. Keep pushing! | ${getRandomHexColor()}`;
    } else if (playerGEXPAccumulated < 1000000) {
        return `/${runChannel} ${requestName} Amazing work, ${lookupName}! You've accumulated ${playerGEXPAccumulated} GEXP over the past week. You're on fire! | ${getRandomHexColor()}`;
    } else if (playerGEXPAccumulated < 250000) {
        return `/${runChannel} ${requestName} Outstanding, ${lookupName}! You've amassed a whopping ${playerGEXPAccumulated} GEXP in the last 7 days. Keep dominating! | ${getRandomHexColor()}`;
    } else {
        return `/${runChannel} ${requestName} [GEXP] ${lookupName} has achieved ${playerGEXPAccumulated} GEXP over the past week. | ${getRandomHexColor()}`;
    }
}

export default {
    name: 'chat:gexp-stats-DM',
    runOnce: false,
    run: async (bot, channel, playerRank, playerName, guildRank, target) => {
        await handleGuildCommand(
            bot,
            channel,
            playerRank,
            playerName,
            guildRank,
            target,
            buildGEXPMessage
        );
    },
} as Event;
