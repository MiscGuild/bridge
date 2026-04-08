/**
 * SkyBlock Dungeons Handler
 */

import { Achievements, SkyBlock, StatsHandler } from '../../types';
import { getRandomHexColor } from '../../utils';

export const skyblockDungeonsHandler: StatsHandler = {
    gameMode: 'SkyBlock Dungeons',
    command: 'sb dungeons',
    description: 'Check SkyBlock dungeon stats',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: SkyBlock
    ): string => {
        if (!stats || !stats.dungeons) {
            return `No SkyBlock dungeon data found for ${playerName}. Are they nicked? | ${getRandomHexColor()}`;
        }

        const dungeons = stats.dungeons;
        const catacombs = dungeons.dungeon_types?.catacombs;
        const selectedClass = dungeons.selected_dungeon_class ?? 'Unknown';
        const classes = dungeons.player_classes ?? {};

        // Catacombs level and experience
        const catacombsExperience = catacombs?.experience ?? 0;
        const catacombsLevel = getCatacombsLevel(catacombsExperience);

        // Floor completions
        const floorCompletions = catacombs?.tier_completions ?? {};
        const f7Completions = floorCompletions['7'] ?? 0;
        const m7Completions = floorCompletions['master_7'] ?? 0;

        // Get selected class level safely
        let selectedClassLevel = 0;
        if (selectedClass && selectedClass.toLowerCase() in classes) {
            const classData = classes[selectedClass.toLowerCase() as keyof typeof classes];
            selectedClassLevel = getClassLevel(classData?.experience ?? 0);
        }

        // Secrets and other stats
        // Secrets are stored directly under dungeons.secrets
        const secretsFound = (dungeons as any)?.secrets ?? 0;

        return `${playerName} Dungeons: Cata ${catacombsLevel} | ${selectedClass} ${selectedClassLevel} | F7: ${f7Completions} M7: ${m7Completions} | Secrets: ${secretsFound.toLocaleString()} | ${getRandomHexColor()}`;
    },
};

/**
 * Calculate Catacombs level from experience
 */
function getCatacombsLevel(experience: number): number {
    // Dungeon XP requirements (cumulative XP needed for each level)
    const dungeonXPTable = [
        0, 50, 125, 235, 395, 625, 955, 1425, 2095, 3045, 4385, 6275, 8940, 12700, 17960, 25340,
        35640, 50040, 70040, 97640, 135640, 188140, 259640, 356640, 488640, 668640, 911640, 1239640,
        1684640, 2284640, 3084640, 4149640, 5559640, 7459640, 9959640, 13259640, 17559640, 23159640,
        30359640, 39559640, 51559640, 66559640, 85559640, 109559640, 139559640, 177559640,
        225559640, 285559640, 360559640, 453559640, 569809640,
    ];

    for (let i = dungeonXPTable.length - 1; i >= 0; i--) {
        if (experience >= dungeonXPTable[i]) {
            return i;
        }
    }
    return 0;
}

/**
 * Calculate dungeon class level from experience
 */
function getClassLevel(experience: number): number {
    // Dungeon XP requirements (cumulative XP needed for each level)
    const dungeonXPTable = [
        0, 50, 125, 235, 395, 625, 955, 1425, 2095, 3045, 4385, 6275, 8940, 12700, 17960, 25340,
        35640, 50040, 70040, 97640, 135640, 188140, 259640, 356640, 488640, 668640, 911640, 1239640,
        1684640, 2284640, 3084640, 4149640, 5559640, 7459640, 9959640, 13259640, 17559640, 23159640,
        30359640, 39559640, 51559640, 66559640, 85559640, 109559640, 139559640, 177559640,
        225559640, 285559640, 360559640, 453559640, 569809640,
    ];

    for (let i = dungeonXPTable.length - 1; i >= 0; i--) {
        if (experience >= dungeonXPTable[i]) {
            return i;
        }
    }
    return 0;
}
