import getRandomHexColor from '../../../../util/getRandomHexColor';
import handleGuildCommand from '../../../../util/handleGuildCommand';

function buildGEXPMessage(
    runChannel: string,
    requestName: string,
    lookupName: string,
    playerGEXP: any
): string {
    const playerGEXPAccumulated = playerGEXP.reduce((acc: any, curr: any) => acc + curr, 0);
    if (playerGEXPAccumulated === 0) {
        return `/${runChannel} No GEXP stats found for ${lookupName}. Make sure the player has been active in the past 7 days. | ${getRandomHexColor()}`;
    } else if (playerGEXPAccumulated < 5000) {
        return `/${runChannel} Great! ${lookupName} has a total of ${playerGEXPAccumulated} GEXP accumulated over the past 7 days. Keep grinding! This member is egible for kick by the way ;-; | ${getRandomHexColor()}`;
    } else if (playerGEXPAccumulated < 10000) {
        return `/${runChannel} Wowies! ${lookupName} has accumulated ${playerGEXPAccumulated} GEXP over the past week. Keep it up! This member is egible for kick by the way ;-; | ${getRandomHexColor()}`;
    } else if (playerGEXPAccumulated < 100000) {
        return `/${runChannel} Impressive! ${lookupName} has racked up ${playerGEXPAccumulated} GEXP in the last 7 days. Keep pushing! | ${getRandomHexColor()}`;
    } else if (playerGEXPAccumulated > 100000 && playerGEXPAccumulated < 250000) {
        return `/${runChannel} Amazing work! ${lookupName} has accumulated ${playerGEXPAccumulated} GEXP over the past week. On fire! | ${getRandomHexColor()}`;
    } else if (playerGEXPAccumulated > 250000) {
        return `/${runChannel} Outstandin'! ${lookupName} has amassed a whopping ${playerGEXPAccumulated} GEXP in the last 7 days. Keep dominating! | ${getRandomHexColor()}`;
    } else {
        return `/${runChannel} ${requestName} [GEXP] ${lookupName} has achieved ${playerGEXPAccumulated} GEXP over the past week. | ${getRandomHexColor()}`;
    }
}

export default {
    name: 'chat:gexp-stats',
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
