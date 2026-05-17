import type Bridge from '@/bridge/bridge';
import { ModuleManager } from '@/modules/types';
import { registerStatsModule } from '@/modules/stats/index';
import { registerSessionsModule, loadActiveSessions } from '@/modules/sessions/index';
import { registerAnalyticsModule, trackEvent } from '@/modules/analytics/index';
import { registerModerationModule } from '@/modules/moderation/index';
import { registerBlacklistModule, runExpirySweep, runGuildScan } from '@/modules/blacklist/index';
import { registerMuteWarnModule } from '@/modules/mute-warn/index';
import { registerInviteTrackerModule } from '@/modules/invite-tracker/index';
import { registerGexpHistoryModule, syncGexpFromGuild } from '@/modules/gexp-history/index';
import { trackGuildEvent, syncGuildMembers } from '@/modules/guild-tracker/index';
import { registerCompareModule } from '@/modules/compare/index';
import { registerNextCalcModule } from '@/modules/next-calc/index';
import { hypixelService } from '@/services/hypixel';
import { mojangService } from '@/services/mojang';
import env from '@/config/env';

export const moduleManager = new ModuleManager();

const commands = moduleManager['commands'] as any[];

// Compare + next-calc must come BEFORE stats so patterns like `!bw <a> vs <b>`
// match the compare handler instead of the stats `!bw [player]` catch-all.
registerCompareModule(commands);
registerNextCalcModule(commands);
registerStatsModule(commands);
registerSessionsModule(commands);
registerAnalyticsModule(commands);
registerModerationModule(commands);
registerBlacklistModule(commands);
registerMuteWarnModule(commands);
registerInviteTrackerModule(commands);
registerGexpHistoryModule(commands);

/** Call this after bridge is ready — wires analytics scheduler + guild sync + GEXP sync */
export function initModules(bridge: Bridge): void {
    const initFn = (commands as any).__initAnalytics;
    if (typeof initFn === 'function') initFn(bridge);

    // Restore in-memory active sessions from disk so they survive bot restarts
    loadActiveSessions().catch(() => {});

    // Sync guild members + GEXP once a day
    const doSync = async () => {
        await syncGuildMembers(bridge).catch(() => {});
        // Also sync GEXP from the same guild data
        try {
            const botName = (
                process.env.MINECRAFT_BOT_NAME ??
                process.env.MINECRAFT_EMAIL ??
                ''
            ).split('@')[0];
            if (botName) {
                const botProfile = await mojangService.getProfile(botName).catch(() => null);
                if (botProfile) {
                    const guild = await hypixelService.getGuild(botProfile.id);
                    if (guild) await syncGexpFromGuild(guild, bridge);
                }
            }
        } catch {
            /* logged inside syncGexpFromGuild */
        }
    };

    doSync();
    setInterval(() => doSync(), 24 * 60 * 60 * 1000);

    // Blacklist auto-expiry sweep
    const expirySweep = () => runExpirySweep(bridge).catch(() => {});
    expirySweep();
    setInterval(expirySweep, env.BLACKLIST_EXPIRY_CHECK_INTERVAL_MINUTES * 60 * 1000);

    // Periodic guild scan for blacklisted UUIDs (re-join enforcement).
    // First run delayed ~60s so it doesn't collide with startup or syncGuildMembers.
    const guildScan = () => runGuildScan(bridge).catch(() => {});
    setTimeout(guildScan, 60 * 1000);
    setInterval(guildScan, env.BLACKLIST_GUILD_SCAN_INTERVAL_MINUTES * 60 * 1000);
}

export { trackEvent, trackGuildEvent };
