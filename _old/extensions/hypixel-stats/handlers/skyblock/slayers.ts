/**
 * SkyBlock Slayers Handler
 */

import { Achievements, SkyBlock, StatsHandler } from '../../types';
import { getRandomHexColor } from '../../utils';

export const skyblockSlayersHandler: StatsHandler = {
    gameMode: 'SkyBlock Slayers',
    command: 'sb slayers',
    description: 'Check SkyBlock slayer stats',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: SkyBlock
    ): string => {
        if (!stats || !stats.slayer_bosses) {
            return `No SkyBlock slayer data found for ${playerName}. Are they nicked? | ${getRandomHexColor()}`;
        }

        const slayers = stats.slayer_bosses;

        // Zombie Slayer
        const zombieXP = slayers.zombie?.xp ?? 0;
        const zombieLevel = getSlayerLevel(zombieXP);

        // Spider Slayer
        const spiderXP = slayers.spider?.xp ?? 0;
        const spiderLevel = getSlayerLevel(spiderXP);

        // Wolf Slayer
        const wolfXP = slayers.wolf?.xp ?? 0;
        const wolfLevel = getSlayerLevel(wolfXP);

        // Enderman Slayer
        const endermanXP = slayers.enderman?.xp ?? 0;
        const endermanLevel = getSlayerLevel(endermanXP);

        // Blaze Slayer
        const blazeXP = slayers.blaze?.xp ?? 0;
        const blazeLevel = getSlayerLevel(blazeXP);

        // Vampire Slayer
        const vampireXP = slayers.vampire?.xp ?? 0;
        const vampireLevel = getSlayerLevel(vampireXP);

        const totalSlayerXP = zombieXP + spiderXP + wolfXP + endermanXP + blazeXP + vampireXP;

        return `${playerName} Slayers: ${totalSlayerXP.toLocaleString()} XP | Z${zombieLevel} S${spiderLevel} W${wolfLevel} E${endermanLevel} B${blazeLevel} V${vampireLevel} | ${getRandomHexColor()}`;
    },
};

/**
 * Calculate slayer level from XP
 */
function getSlayerLevel(xp: number): number {
    const slayerXP = [5, 15, 200, 1000, 5000, 20000, 100000, 400000, 1000000];
    let level = 0;

    for (let i = 0; i < slayerXP.length; i++) {
        if (xp >= slayerXP[i]) {
            level = i + 1;
        } else {
            break;
        }
    }

    return level;
}
