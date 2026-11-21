// Static application constants — values that never change at runtime

export const HYPIXEL_HOST = 'mc.hypixel.net';
export const HYPIXEL_PORT = 25565;
export const MINECRAFT_VERSION = '1.8.9';
export const HYPIXEL_API_BASE = 'https://api.hypixel.net';
export const HYPIXEL_API_V2_BASE = 'https://api.hypixel.net/v2';
export const MOJANG_API_BASE = 'https://api.mojang.com';
export const CORAL_API_BASE = 'https://api.urchin.gg';

/** Hypixel rank color mapping (rank tag → hex color) */
export const RANK_COLORS: Record<string, number> = {
    '[MVP++]': 0xffaa00,
    '[MVP+]': 0x55ffff,
    '[MVP]': 0x55ffff,
    '[VIP+]': 0x55ff55,
    '[VIP]': 0x55ff55,
    '[YOUTUBE]': 0xff5555,
    '[HELPER]': 0x5555ff,
    '[MOD]': 0x55ff55,
    '[ADMIN]': 0xff5555,
    '[OWNER]': 0xff5555,
};

export const DEFAULT_EMBED_COLOR = 0x36393f;

/** Bot connection state machine */
export const BOT_STATES = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    LIMBO: 'limbo',
} as const;

export type BotState = (typeof BOT_STATES)[keyof typeof BOT_STATES];

/** Hypixel stat cache TTL (ms) */
export const STATS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Max message queue size before dropping */
export const MAX_QUEUE_SIZE = 100;

/** Minecraft chat rate limit (ms between sends) */
export const MC_CHAT_RATE_MS = 600;

/** A connect attempt that hasn't logged in by then is abandoned and retried */
export const MC_LOGIN_TIMEOUT_MS = 60 * 1000;

/** The reconnect delay doubles after each failed reconnect, up to this */
export const MC_RECONNECT_MAX_DELAY_MS = 5 * 60 * 1000;

/** Health relogins past MINECRAFT_HEALTH_RELOGIN_MAX_ATTEMPTS slow down to one per this interval */
export const HEALTH_SLOW_RELOGIN_MS = 30 * 60 * 1000;
