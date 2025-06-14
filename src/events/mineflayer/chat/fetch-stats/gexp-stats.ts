import getRandomHexColor from '../../../../util/getRandomHexColor';
import handleGuildCommand from '../../../../util/handleGuildCommand';

function buildGEXPMessage(
    runChannel: string,
    requestName: string,
    lookupName: string,
    playerGEXP: any
): string {
    const playerGEXPAccumulated = playerGEXP.reduce((acc: any, curr: any) => acc + curr, 0);
    return `/${runChannel} ${requestName}, Here are the GEXP stats for ${lookupName}: '${playerGEXPAccumulated}' acumulated GEXP over the past 7 days. | ${getRandomHexColor()}`;
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
