import { getRandomHexColor } from '../utils/getRandomHexColor';
import { handleStatsCommand } from '../utils/handleStatsCommand';


const commandCooldowns = new Map<string, number>();

function buildStatsMessage(lookupName: string, achievements: any, stats: any): string {
    const wins = stats?.wins ?? 0;
    const losses = stats?.losses ?? 1;
    const gamesPlayed = stats?.games ?? 0;
    const kills = stats?.kills ?? 0;
    const deaths = stats?.deaths ?? 1;
    const kdr = (kills / deaths).toFixed(2);
    const wlr = (wins / losses).toFixed(2);

    return `/gc [Murder Mystery] IGN: ${lookupName} | KILLS: ${kills} | WINS: ${wins} | KDR: ${kdr} | WLR: ${wlr} | GAMES PLAYED: ${gamesPlayed} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:mm-stats',
    runOnce: false,
    run: async (bot, channel, playerRank, playerName, guildRank, target) => {
        await handleStatsCommand(bot, channel, playerRank, playerName, guildRank, target, 'MurderMystery', buildStatsMessage);
    }
} as Event;