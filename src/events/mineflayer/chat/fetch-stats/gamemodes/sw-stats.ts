import { handleStatsCommand } from '../utils/handleStatsCommand';
import { getRandomHexColor } from '../utils/getRandomHexColor'
import fetchMojangProfile from '@requests/fetch-mojang-profile';
import fetchHypixelGuild from '@requests/fetch-hypixel-guild';

function buildStatsMessage(
    lookupName: string,
    achievements: any,
    stats: any
): string {
    const playerLevel = stats?.levelFormatted ?? 0;

    const matches = [...playerLevel.matchAll(/§[0-9a-f](\d)/gi)];
    const rm_playerLevel = matches.map(m => m[1]).join("");


    const winsSolo = achievements?.skywars_wins_solo ?? 0;
    const winsTeams = achievements?.skywars_wins_team ?? 0;
    const killsSolo = achievements?.skywars_kills_solo ?? 0;
    const killsTeams = achievements?.skywars_kills_team ?? 0;
    const soloDeaths = stats?.deaths_solo ?? 0;
    const teamsDeaths = stats?.deaths_team ?? 0;

    const lossesSolo = stats?.losses_solo ?? 0;
    const lossesTeams = stats?.losses_team ?? 0;
    const losses = lossesSolo + lossesTeams;

    const deaths = soloDeaths + teamsDeaths;
    
    const totalWins = winsSolo + winsTeams;
    const totalKills = killsSolo + killsTeams;
    const kdr = (totalKills / (deaths ? deaths : 1)).toFixed(2);
    const wlr = (totalWins / (losses ? losses : 1)).toFixed(2);

    return `/gc [StarWars] IGN: ${lookupName} | LVL: ${rm_playerLevel} | WINS: ${totalWins} | Kills: ${totalKills} | KDR: ${kdr} | WLR: ${wlr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:sw-stats',
    runOnce: false,
    run: async (bot, channel, playerRank, playerName, guildRank, target) => {
        await handleStatsCommand(bot, channel, playerRank, playerName, guildRank, target, 'SkyWars', buildStatsMessage);
    }
} as Event;
