import consola from 'consola';
import { config } from 'dotenv';
import { z } from 'zod';

const BOOLEAN = z
    .string()
    .toLowerCase()
    .transform((x) => x === 'true')
    .pipe(z.boolean());

const OPTIONAL_BOOLEAN = BOOLEAN.optional();
const OPTIONAL_STRING = z.string().optional();
const SNOWFLAKE = z.coerce.string().regex(/^\d+$/);

const envSchema = z.object({
    // === MINECRAFT ===
    MINECRAFT_EMAIL: z.string().email(),
    MINECRAFT_PASSWORD: OPTIONAL_STRING,
    MINECRAFT_CHAT_SEPARATOR: z.string().trim().min(1).default('»'),
    MINECRAFT_RECONNECT_DELAY: z.coerce.number().int().positive().default(10),

    // === HYPIXEL ===
    HYPIXEL_API_KEY: z.string().min(1),
    FALLBACK_HYPIXEL_API_KEY: OPTIONAL_STRING,
    '2ND_FALLBACK_HYPIXEL_API_KEY': OPTIONAL_STRING,
    HYPIXEL_GUILD_NAME: z.string().min(1),

    // === DISCORD ===
    DISCORD_TOKEN: z.string().min(1),
    DISCORD_SERVER_ID: SNOWFLAKE,
    DISCORD_IGNORE_PREFIX: z.string().trim().min(1).default('!'),
    DISCORD_INVITE_LINK: z.string().startsWith('discord.gg/'),
    MEMBER_CHANNEL_ID: SNOWFLAKE,
    OFFICER_CHANNEL_ID: SNOWFLAKE,
    BLACKLIST_CHANNEL_ID: SNOWFLAKE,
    BOT_OWNER_ID: SNOWFLAKE,
    STAFF_ROLE_ID: SNOWFLAKE,

    // === DISCORD OAUTH (for API/dashboard) ===
    DISCORD_CLIENT_ID: OPTIONAL_STRING,
    DISCORD_CLIENT_SECRET: OPTIONAL_STRING,
    DISCORD_REDIRECT_URI: OPTIONAL_STRING,

    // === SUPABASE ===
    SUPABASE_URL: OPTIONAL_STRING,
    SUPABASE_ANON_KEY: OPTIONAL_STRING,
    SUPABASE_SERVICE_KEY: OPTIONAL_STRING,

    // === EXPRESS API ===
    API_PORT: z.coerce.number().int().positive().default(3001),
    API_KEY: OPTIONAL_STRING,
    JWT_SECRET: z.string().default('change-me-in-production'),

    // === FILTERS ===
    USE_PROFANITY_FILTER: BOOLEAN.default('true'),
    USE_BRAINROT_FILTER: BOOLEAN.default('true'),
    USE_FIRST_WORD_OF_AUTHOR_NAME: BOOLEAN.default('false'),
    MINIMUM_NETWORK_LEVEL: z.coerce.number().min(0).default(0),

    // === REMINDERS ===
    REMINDER_ENABLED: BOOLEAN.default('false'),
    REMINDER_MESSAGE: z.string().max(256).default(''),
    REMINDER_FREQUENCY: z.coerce.number().int().positive().default(60),

    // === STAFF / MODERATION ===
    BAN_ALLOWED_RANKS: OPTIONAL_STRING,
    BAN_CHECK_INTERVAL: z.coerce.number().int().min(1).default(10),
    URCHIN_JOIN_CHECK: OPTIONAL_BOOLEAN,
    URCHIN_API_KEY: OPTIONAL_STRING,


    // === BRIDGE ACCESS ROLES ===
    BRIDGE_MUTED_ROLE_ID: OPTIONAL_STRING,    // Discord role that blocks bridge usage only
    BRIDGE_ACCESS_ROLE_ID: OPTIONAL_STRING,   // Discord role for non-guild bridge access
    GUILD_MEMBER_ROLE_IDS: OPTIONAL_STRING,   // Comma-separated role IDs that indicate guild membership
    MUTED_ROLE_ID: OPTIONAL_STRING,           // Discord role for full server mute (synced with /g mute)

    // === TERMINAL REPL ===
    ENABLE_TERMINAL: OPTIONAL_BOOLEAN,

    // === COOLDOWNS (seconds, 0 = no cooldown) ===
    // Tier 1 = lowest/member rank, Tier 5 = highest non-GM rank. GM always gets 0.
    COOLDOWN_RANK_1: z.coerce.number().int().min(0).default(60),
    COOLDOWN_RANK_2: z.coerce.number().int().min(0).default(20),
    COOLDOWN_RANK_3: z.coerce.number().int().min(0).default(15),
    COOLDOWN_RANK_4: z.coerce.number().int().min(0).default(12),
    COOLDOWN_RANK_5: z.coerce.number().int().min(0).default(10),
    COOLDOWN_LEADER: z.coerce.number().int().min(0).default(0),
    COOLDOWN_URCHIN: z.coerce.number().int().min(0).default(5),

    // === RANK FALLBACKS (used when Hypixel API is unavailable) ===
    // Format: "Name:Tag" or just "Name". Chat shows the tag, not the name.
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
});

config();

const result = envSchema.safeParse(process.env);

if (!result.success) {
    consola.error('Invalid configuration:');
    consola.error(result.error.format());
    process.exit(1);
}

export default result.data!;
export type Env = z.infer<typeof envSchema>;
