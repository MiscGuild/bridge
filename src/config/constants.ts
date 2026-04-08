// Static application constants — values that never change at runtime

export const HYPIXEL_HOST = 'mc.hypixel.net';
export const HYPIXEL_PORT = 25565;
export const MINECRAFT_VERSION = '1.8.9';
export const HYPIXEL_API_BASE = 'https://api.hypixel.net';
export const MOJANG_API_BASE = 'https://api.mojang.com';

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

/** Chat modes for the Minecraft bot */
export const CHAT_MODES = {
    GUILD: 'gc',
    OFFICER: 'oc',
    PARTY: 'pc',
} as const;

/** Bot connection state machine */
export const BOT_STATES = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    LIMBO: 'limbo',
} as const;

export type BotState = (typeof BOT_STATES)[keyof typeof BOT_STATES];

/** Supported Hypixel game modes for stats */
export const GAME_MODES = [
    'bedwars',
    'skywars',
    'duels',
    'uhc',
    'buildbattle',
    'murdermystery',
    'tntgames',
    'megawalls',
    'arcade',
    'copsandcrims',
    'pit',
    'skyblock',
    'woolwars',
    'smash',
    'speeduhc',
    'blitz',
    'paintball',
    'quakecraft',
    'vampirez',
    'walls',
] as const;

export type GameMode = (typeof GAME_MODES)[number];

/** Ban types */
export const BAN_TYPES = {
    GUILD: 'guild',
    BRIDGE: 'bridge',
    COMMAND: 'command',
} as const;

export type BanType = (typeof BAN_TYPES)[keyof typeof BAN_TYPES];

/** API response shapes */
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

/** Hypixel stat cache TTL (ms) */
export const STATS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Max message queue size before dropping */
export const MAX_QUEUE_SIZE = 100;

/** Minecraft chat rate limit (ms between sends) */
export const MC_CHAT_RATE_MS = 600;
