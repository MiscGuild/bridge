import { Achievements, Duels } from '../../../../../../requests/fetch-hypixel-player-profile';
import getRandomHexColor from '../../../../../../util/getRandomHexColor';
import handleStatsCommand from '../../../../../../util/handleStatsCommand';

function buildStatsMessage(playerName: string, achievements: Achievements, stats: Duels): string {
    const soloKills = stats?.uhc_duel_kills ?? 0;
    const doublesKills = stats?.uhc_doubles_kills ?? 0;
    const fourKills = stats?.uhc_four_kills ?? 0;
    const meetupKills = stats?.uhc_meetup_kills ?? 0;
    const kills = soloKills + doublesKills + fourKills + meetupKills;

    const soloDeaths = stats?.uhc_duel_deaths ?? 0;
    const doublesDeaths = stats?.uhc_doubles_deaths ?? 0;
    const fourDeaths = stats?.uhc_four_deaths ?? 0;
    const meetupDeaths = stats?.uhc_meetup_deaths ?? 0;
    const deaths = soloDeaths + doublesDeaths + fourDeaths + meetupDeaths;

    const soloWins = stats?.uhc_duel_wins ?? 0;
    const doublesWins = stats?.uhc_doubles_wins ?? 0;
    const fourWins = stats?.uhc_four_wins ?? 0;
    const meetupWins = stats?.uhc_meetup_wins ?? 0;
    const wins = soloWins + doublesWins + fourWins + meetupWins;

    const soloLosses = stats?.uhc_duel_losses ?? 0;
    const doublesLosses = stats?.uhc_doubles_losses ?? 0;
    const fourLosses = stats?.uhc_four_losses ?? 0;
    const meetupLosses = stats?.uhc_meetup_losses ?? 0;
    const losses = soloLosses + doublesLosses + fourLosses + meetupLosses;

    const wlr = (losses === 0 ? wins : wins / losses).toFixed(2);
    const kdr = (deaths === 0 ? kills : kills / deaths).toFixed(2);

    return `/gc [UHC Duels] IGN: ${playerName} | WINS: ${wins} | KILLS: ${kills} | KDR: ${kdr} | WLR: ${wlr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:duels-uhc',
    runOnce: false,
    run: async (bot, channel, playerRank, playerName, guildRank, target) => {
        await handleStatsCommand(
            bot,
            channel,
            playerRank,
            playerName,
            guildRank,
            target,
            'Duels',
            buildStatsMessage
        );
    },
} as Event;
