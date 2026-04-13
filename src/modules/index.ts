import type Bridge from '@/bridge/bridge';
import type { ParsedChatEvent } from '@/bot/chat-parser';
import { ModuleManager } from '@/modules/types';
import { registerStatsModule } from '@/modules/stats/index';
import { registerSessionsModule } from '@/modules/sessions/index';
import { registerAnalyticsModule, trackEvent } from '@/modules/analytics/index';
import { registerModerationModule } from '@/modules/moderation/index';
import { registerBlacklistModule } from '@/modules/blacklist/index';
import { registerMuteWarnModule } from '@/modules/mute-warn/index';
import { registerInviteTrackerModule } from '@/modules/invite-tracker/index';
import { trackGuildEvent, syncGuildMembers } from '@/modules/guild-tracker/index';

export const moduleManager = new ModuleManager();

const commands = moduleManager['commands'] as any[];

registerStatsModule(commands);
registerSessionsModule(commands);
registerAnalyticsModule(commands);
registerModerationModule(commands);
registerBlacklistModule(commands);
registerMuteWarnModule(commands);
registerInviteTrackerModule(commands);

/** Call this after bridge is ready — wires analytics scheduler + guild sync */
export function initModules(bridge: Bridge): void {
    const initFn = (commands as any).__initAnalytics;
    if (typeof initFn === 'function') initFn(bridge);

    // Sync guild members once a day
    syncGuildMembers(bridge).catch(() => {});
    setInterval(() => syncGuildMembers(bridge).catch(() => {}), 24 * 60 * 60 * 1000);
}

export { trackEvent, trackGuildEvent };
