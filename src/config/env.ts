import consola from 'consola';
import { config } from 'dotenv';
import { z } from 'zod';

const BOOLEAN = z
    .string()
    .toLowerCase()
    .transform((x) => x === 'true')
    .pipe(z.boolean());

const OPTIONAL_STRING = z.string().optional();
const SNOWFLAKE = z.coerce.string().regex(/^\d+$/);
const POSITIVE_INT = z.coerce.number().int().min(1);
const SECONDS = z.coerce.number().int().min(0);

/** Every setting the bot reads. `.env.example` describes each one. */
const envSchema = z.object({
    // ── Minecraft ──
    MINECRAFT_EMAIL: z.string().email(),
    MINECRAFT_CHAT_SEPARATOR: z.string().trim().min(1).default('»'),
    MINECRAFT_RECONNECT_DELAY: POSITIVE_INT.default(10),

    // ── Limbo keep-alive ──
    /** Seconds between /limbo retries while connected but not yet in limbo */
    MINECRAFT_LIMBO_RETRY_COOLDOWN_SECONDS: POSITIVE_INT.default(15),
    /** /limbo attempts per session before relogging */
    MINECRAFT_LIMBO_MAX_ATTEMPTS: POSITIVE_INT.default(5),
    /** Sessions in a row that fail to reach limbo before the process exits */
    MINECRAFT_LIMBO_EXIT_AFTER_SESSIONS: POSITIVE_INT.default(3),
    /** Seconds connected but outside limbo before the health monitor relogs */
    MINECRAFT_LIMBO_CONNECTED_GRACE_SECONDS: POSITIVE_INT.default(90),

    // ── Health relogin ──
    MINECRAFT_HEALTH_RELOGIN_ENABLED: BOOLEAN.default('true'),
    /** Minutes disconnected (or out of limbo) before a relogin */
    MINECRAFT_HEALTH_RELOGIN_GRACE_MINUTES: POSITIVE_INT.default(2),
    /** Minimum minutes between relogins */
    MINECRAFT_HEALTH_RELOGIN_COOLDOWN_MINUTES: POSITIVE_INT.default(5),
    /** Relogins before giving up… */
    MINECRAFT_HEALTH_RELOGIN_MAX_ATTEMPTS: POSITIVE_INT.default(5),
    /** …until the bot has been healthy for this many minutes */
    MINECRAFT_HEALTH_RELOGIN_RESET_MINUTES: POSITIVE_INT.default(30),

    // ── Hypixel ──
    HYPIXEL_API_KEY: z.string().min(1),
    FALLBACK_HYPIXEL_API_KEY: OPTIONAL_STRING,
    HYPIXEL_GUILD_NAME: z.string().min(1),

    // ── Discord ──
    DISCORD_TOKEN: z.string().min(1),
    DISCORD_INVITE_LINK: z.string().startsWith('discord.gg/'),
    MEMBER_CHANNEL_ID: SNOWFLAKE,
    OFFICER_CHANNEL_ID: SNOWFLAKE,
    BLACKLIST_CHANNEL_ID: SNOWFLAKE,
    STAFF_ROLE_ID: SNOWFLAKE,
    BOT_OWNER_ID: SNOWFLAKE,
    DISCORD_IGNORE_PREFIX: z.string().trim().min(1).default('!'),

    // ── Bridge access roles ──
    /** Members with this role can't send messages to Minecraft */
    BRIDGE_MUTED_ROLE_ID: OPTIONAL_STRING,
    /** Comma-separated roles that count as guild members */
    GUILD_MEMBER_ROLE_IDS: OPTIONAL_STRING,
    /** Lets non-guild members use the bridge */
    BRIDGE_ACCESS_ROLE_ID: OPTIONAL_STRING,

    // ── Discord → Minecraft messages ──
    USE_PROFANITY_FILTER: BOOLEAN.default('true'),
    USE_FIRST_WORD_OF_AUTHOR_NAME: BOOLEAN.default('false'),

    // ── Reminders ──
    REMINDER_ENABLED: BOOLEAN.default('false'),
    REMINDER_MESSAGE: z.string().max(256).default(''),
    REMINDER_FREQUENCY: POSITIVE_INT.default(60),

    // ── Blacklist & Coral ──
    /** Coral (api.urchin.gg) API key */
    URCHIN_API_KEY: OPTIONAL_STRING,
    /** Report Coral tags in officer chat when someone joins */
    URCHIN_JOIN_CHECK: BOOLEAN.default('false'),
    /** Show "Miscellaneous Staff" instead of the moderator in blacklist embeds */
    BLACKLIST_ANONYMOUS: BOOLEAN.default('false'),
    BLACKLIST_REJOIN_EXTENSION_MONTHS: POSITIVE_INT.default(2),
    BLACKLIST_GUILD_SCAN_INTERVAL_MINUTES: POSITIVE_INT.default(5),
    BLACKLIST_EXPIRY_CHECK_INTERVAL_MINUTES: POSITIVE_INT.default(5),

    // ── Staff & cooldowns ──
    /** Lowest rank tier (1–5) that can use in-game staff commands */
    STAFF_MIN_RANK: z.coerce.number().int().min(1).max(5).default(4),
    /** Command cooldowns in seconds; tier 1 is the lowest rank */
    COOLDOWN_RANK_1: SECONDS.default(60),
    COOLDOWN_RANK_2: SECONDS.default(20),
    COOLDOWN_RANK_3: SECONDS.default(15),
    COOLDOWN_RANK_4: SECONDS.default(12),
    COOLDOWN_RANK_5: SECONDS.default(10),
    COOLDOWN_LEADER: SECONDS.default(0),

    // ── Rank fallbacks (used when the Hypixel API can't be reached) ──
    RANK_1_NAME: z.string().default(''),
    RANK_1_TAG: z.string().default(''),
    RANK_2_NAME: z.string().default(''),
    RANK_2_TAG: z.string().default(''),
    RANK_3_NAME: z.string().default(''),
    RANK_3_TAG: z.string().default(''),
    RANK_4_NAME: z.string().default(''),
    RANK_4_TAG: z.string().default(''),
    RANK_5_NAME: z.string().default(''),
    RANK_5_TAG: z.string().default(''),
    RANK_LEADER_TAG: z.string().default('GM'),

    // ── Terminal ──
    ENABLE_TERMINAL: BOOLEAN.default('false'),
    /** Send plain terminal lines to guild chat */
    ENABLE_TERMINAL_CHAT: BOOLEAN.default('false'),
});

config();

const result = envSchema.safeParse(process.env);

if (!result.success) {
    consola.error('Invalid configuration:');
    consola.error(result.error.format());
    process.exit(1);
}

export default result.data!;
