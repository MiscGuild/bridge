import type Bridge from '@/bridge/bridge';
import { ModuleManager } from '@/modules/types';
import { registerStatsModule } from '@/modules/stats/index';
import { registerSessionsModule } from '@/modules/sessions/index';
import { registerAnalyticsModule, trackEvent } from '@/modules/analytics/index';
import { registerModerationModule } from '@/modules/moderation/index';
import { registerBlacklistModule } from '@/modules/blacklist/index';
import { registerMuteWarnModule } from '@/modules/mute-warn/index';
import { registerInviteTrackerModule } from '@/modules/invite-tracker/index';
import { registerGexpHistoryModule, syncGexpFromGuild } from '@/modules/gexp-history/index';
import { trackGuildEvent, syncGuildMembers } from '@/modules/guild-tracker/index';
import { hypixelService } from '@/services/hypixel';
import { mojangService } from '@/services/mojang';

export const moduleManager = new ModuleManager();

const commands = moduleManager['commands'] as any[];

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

    // Sync guild members + GEXP once a day
    const doSync = async () => {
        await syncGuildMembers(bridge).catch(() => {});
        // Also sync GEXP from the same guild data
        try {
            const botName = (process.env.MINECRAFT_BOT_NAME ?? process.env.MINECRAFT_EMAIL ?? '').split('@')[0];
            if (botName) {
                const botProfile = await mojangService.getProfile(botName).catch(() => null);
                if (botProfile) {
                    const guild = await hypixelService.getGuild(botProfile.id);
                    if (guild) await syncGexpFromGuild(guild, bridge);
                }
            }
        } catch { /* logged inside syncGexpFromGuild */ }
    };

    doSync();
    setInterval(() => doSync(), 24 * 60 * 60 * 1000);
}

export { trackEvent, trackGuildEvent };
