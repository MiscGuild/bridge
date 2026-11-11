import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';
import env from '@/config/env';
import { registerBlacklistModule, runExpirySweep, runGuildScan } from '@/modules/blacklist/index';
import { registerCompareModule } from '@/modules/compare/index';
import { registerModerationModule } from '@/modules/moderation/index';
import { registerNextCalcModule } from '@/modules/next-calc/index';
import { registerSessionsModule, loadActiveSessions } from '@/modules/sessions/index';
import { registerStatsModule } from '@/modules/stats/index';
import { ModuleManager } from '@/modules/types';

export const moduleManager = new ModuleManager();

const { commands } = moduleManager;

// Commands are checked in this order and the first match wins. Compare must come
// before stats so `!bw <a> vs <b>` isn't treated as `!bw <player>`.
registerCompareModule(commands);
registerNextCalcModule(commands);
registerStatsModule(commands);
registerSessionsModule(commands);
registerModerationModule(commands);
registerBlacklistModule(commands);

/** Start the background jobs. Call once the bridge has connected. */
export function initModules(bridge: Bridge): void {
    // Stat sessions survive restarts
    loadActiveSessions().catch((err) =>
        consola.warn('[sessions] failed to restore active sessions:', err)
    );

    // Lift blacklist entries that have expired
    const expirySweep = () => runExpirySweep(bridge).catch(() => {});
    expirySweep();
    setInterval(expirySweep, env.BLACKLIST_EXPIRY_CHECK_INTERVAL_MINUTES * 60 * 1000);

    // Kick blacklisted players who got back into the guild. First run is delayed
    // a minute so it doesn't compete with startup.
    const guildScan = () => runGuildScan(bridge).catch(() => {});
    setTimeout(guildScan, 60 * 1000);
    setInterval(guildScan, env.BLACKLIST_GUILD_SCAN_INTERVAL_MINUTES * 60 * 1000);
}
