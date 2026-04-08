/**
 * SkyBlock Overview Handler
 */

import { Achievements, SkyBlock, StatsHandler } from '../../types';
import { getRandomHexColor } from '../../utils';

export const skyblockOverviewHandler: StatsHandler = {
    gameMode: 'SkyBlock',
    command: 'sb',
    description: 'Check SkyBlock overview',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: SkyBlock
    ): string => {
        if (!stats || Object.keys(stats).length === 0) {
            return `No SkyBlock stats found for ${playerName}. Are they nicked? | ${getRandomHexColor()}`;
        }

        // Skills - from leveling.experience or player_data.experience
        const skillData = (stats as any).leveling?.experience || {};
        const farmingLevel = skillData.SKILL_FARMING
            ? calculateSkillLevel(skillData.SKILL_FARMING)
            : 0;
        const miningLevel = skillData.SKILL_MINING
            ? calculateSkillLevel(skillData.SKILL_MINING)
            : 0;
        const combatLevel = skillData.SKILL_COMBAT
            ? calculateSkillLevel(skillData.SKILL_COMBAT)
            : 0;
        const foragingLevel = skillData.SKILL_FORAGING
            ? calculateSkillLevel(skillData.SKILL_FORAGING)
            : 0;
        const fishingLevel = skillData.SKILL_FISHING
            ? calculateSkillLevel(skillData.SKILL_FISHING)
            : 0;
        const enchantingLevel = skillData.SKILL_ENCHANTING
            ? calculateSkillLevel(skillData.SKILL_ENCHANTING)
            : 0;
        const alchemyLevel = skillData.SKILL_ALCHEMY
            ? calculateSkillLevel(skillData.SKILL_ALCHEMY)
            : 0;
        const tamingLevel = skillData.SKILL_TAMING
            ? calculateSkillLevel(skillData.SKILL_TAMING)
            : 0;

        // Calculate average skill level
        const skillLevels = [
            farmingLevel,
            miningLevel,
            combatLevel,
            foragingLevel,
            fishingLevel,
            enchantingLevel,
            alchemyLevel,
            tamingLevel,
        ];
        const averageSkillLevel =
            skillLevels.reduce((sum, level) => sum + level, 0) / skillLevels.length;

        // Purse coins - from currencies.coin_purse
        const purseCoins = (stats as any).currencies?.coin_purse ?? 0;

        // SkyBlock level - from leveling.experience
        const skyblockXP = (stats as any).leveling?.experience ?? 0;
        const skyblockLevel = calculateSkyBlockLevel(skyblockXP);

        return `[SB Overview] P: ${playerName} | LVL: ${skyblockLevel} | Skills: ${averageSkillLevel.toFixed(1)} | Purse: ${purseCoins.toLocaleString(1)} | ${getRandomHexColor()}`;
    },
};

/**
 * Calculate SkyBlock level from experience points
 * SkyBlock level formula: 100 XP per level
 */
function calculateSkyBlockLevel(xp: number): number {
    // Simple calculation: 100 XP per level
    return Math.floor(xp / 100);
}

/**
 * Calculate skill level from experience points using SkyBlock skill XP table
 */
function calculateSkillLevel(xp: number): number {
    // SkyBlock skill XP requirements (cumulative XP needed for each level)
    const skillXPTable = [
        0, 50, 175, 375, 675, 1175, 1925, 2925, 4425, 6425, 9925, 14925, 22425, 32425, 47425, 67425,
        97425, 147425, 222425, 322425, 522425, 822425, 1222425, 1722425, 2322425, 3022425, 3822425,
        4722425, 5722425, 6822425, 8022425, 9322425, 10722425, 13822425, 15522425, 17322425,
        19222425, 21222425, 23322425, 25522425, 27822425, 30222425, 32722425, 35322425, 38072425,
        40972425, 44072425, 47472425, 51172425, 55172425, 59472425, 64072425, 68972425, 74172425,
        79672425, 85472425, 91572425, 97972425, 104672425, 111672425,
    ];

    for (let i = skillXPTable.length - 1; i >= 0; i--) {
        if (xp >= skillXPTable[i]) {
            return i;
        }
    }
    return 0;
}
