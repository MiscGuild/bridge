import { Achievements } from '@requests/fetch-hypixel-player-profile';
import { Bedwars } from '@requests/fetch-hypixel-player-profile';
import { getRandomHexColor } from '../utils/getRandomHexColor';
import { handleStatsCommand } from '../utils/handleStatsCommand';


function buildStatsMessage(playerName: string, achievements: Achievements, stats: Bedwars): string {
    const level = achievements?.bedwars_level ?? 0;
    const solo_wins = stats?.eight_one_wins_bedwars ?? 0;
    const doubles_wins = stats?.eight_two_wins_bedwars ?? 0;
    const threes_wins = stats?.four_three_wins_bedwars ?? 0;
    const fours_wins = stats?.four_four_wins_bedwars ?? 0;

    const solo_losses = stats?.eight_one_losses_bedwars ?? 0;
    const doubles_losses = stats?.eight_two_losses_bedwars ?? 0;
    const threes_losses = stats?.four_three_losses_bedwars ?? 0;
    const fours_losses = stats?.four_four_losses_bedwars ?? 0;

    const solo_bed_breaks = stats?.eight_one_beds_broken_bedwars ?? 0;
    const doubles_bed_breaks = stats?.eight_two_beds_broken_bedwars ?? 0;
    const threes_bed_breaks = stats?.four_three_beds_broken_bedwars ?? 0;
    const fours_bed_breaks = stats?.four_four_beds_broken_bedwars ?? 0;

    const solo_bed_losses = stats?.eight_one_beds_lost_bedwars ?? 0;
    const doubles_bed_losses = stats?.eight_two_beds_lost_bedwars ?? 0;
    const threes_bed_losses = stats?.four_three_beds_lost_bedwars ?? 0;
    const fours_bed_losses = stats?.four_four_beds_lost_bedwars ?? 0;

    const final_kills = stats?.final_kills_bedwars ?? 0;
    const final_deaths = !stats?.final_deaths_bedwars ? 1 : stats?.final_deaths_bedwars;

    const total_wins = solo_wins + doubles_wins + threes_wins + fours_wins;
    const total_losses = solo_losses + doubles_losses + threes_losses + fours_losses;
    const total_bed_breaks = solo_bed_breaks + doubles_bed_breaks + threes_bed_breaks + fours_bed_breaks;
    const total_bed_losses = solo_bed_losses + doubles_bed_losses + threes_bed_losses + fours_bed_losses;
    const fkdr = (final_deaths === 0 ? final_kills : final_kills / final_deaths).toFixed(2);
    const wlr = (total_losses === 0 ? total_wins : total_wins / total_losses).toFixed(2);
    const bblr = (total_bed_losses === 0 ? total_bed_breaks : total_bed_breaks / total_bed_losses).toFixed(2);

    return `/gc [BedWars] IGN: ${playerName} | LVL: ${level} | WINS: ${total_wins} | FKDR: ${fkdr} | BBLR: ${bblr} | WLR: ${wlr} | ${getRandomHexColor()}`;
}


export default {
    name: 'chat:bw-stats',
    runOnce: false,
    run: async (bot, channel, playerRank, playerName, guildRank, target) => {
        await handleStatsCommand(bot, channel, playerRank, playerName, guildRank, target, 'Bedwars', buildStatsMessage);
    }
} as Event;

