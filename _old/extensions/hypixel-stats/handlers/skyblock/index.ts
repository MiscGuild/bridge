/**
 * Export all SkyBlock handlers
 */

export { skyblockOverviewHandler } from './overview';
export { skyblockSkillsHandler } from './skills';
export { skyblockSlayersHandler } from './slayers';
export { skyblockDungeonsHandler } from './dungeons';
export { skyblockNetworthHandler } from './networth';

// Networth subcommand handlers
export {
    networthArmorHandler,
    networthWardrobeHandler,
    networthInventoryHandler,
    networthStorageHandler,
    networthEquipmentHandler,
    networthEnderchestHandler,
    networthPetsHandler,
} from './networth-all';

import { skyblockOverviewHandler } from './overview';
import { skyblockSkillsHandler } from './skills';
import { skyblockSlayersHandler } from './slayers';
import { skyblockDungeonsHandler } from './dungeons';
import { skyblockNetworthHandler } from './networth';

// Networth subcommand handlers
import {
    networthArmorHandler,
    networthWardrobeHandler,
    networthInventoryHandler,
    networthStorageHandler,
    networthEquipmentHandler,
    networthEnderchestHandler,
    networthPetsHandler,
} from './networth-all';

export const allSkyblockHandlers = [
    skyblockOverviewHandler,
    skyblockSkillsHandler,
    skyblockSlayersHandler,
    skyblockDungeonsHandler,
    skyblockNetworthHandler,
    networthArmorHandler,
    networthWardrobeHandler,
    networthInventoryHandler,
    networthStorageHandler,
    networthEquipmentHandler,
    networthEnderchestHandler,
    networthPetsHandler,
];
