/**
 * Export all game mode handlers
 */

export { bedwarsHandler } from './bedwars';
export { skywarsHandler } from './skywars';
export { duelsHandler } from './duels';
export { uhcHandler } from './uhc';
export { buildBattleHandler } from './buildbattle';
export { murderMysteryHandler } from './murdermystery';
export { tntGamesHandler } from './tntgames';
export { megaWallsHandler } from './megawalls';
export { arcadeHandler } from './arcade';

import { bedwarsHandler } from './bedwars';
import { skywarsHandler } from './skywars';
import { duelsHandler } from './duels';
import { uhcHandler } from './uhc';
import { buildBattleHandler } from './buildbattle';
import { murderMysteryHandler } from './murdermystery';
import { tntGamesHandler } from './tntgames';
import { megaWallsHandler } from './megawalls';
import { arcadeHandler } from './arcade';

export const allHandlers = [
    bedwarsHandler,
    skywarsHandler,
    duelsHandler,
    uhcHandler,
    buildBattleHandler,
    murderMysteryHandler,
    tntGamesHandler,
    megaWallsHandler,
    arcadeHandler
];
