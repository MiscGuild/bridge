import consola from 'consola';
import { config } from 'dotenv';
import { z } from 'zod';

const BOOLEAN_SCHEMA = z
    .string()
    .toLowerCase()
    .transform((x) => x === 'true')
    .pipe(z.boolean());

const _OPTIONAL_BOOLEAN_SCHEMA = z
    .string()
    .toLowerCase()
    .transform((x) => x === 'true')
    .pipe(z.boolean())
    .optional();

const SNOWFLAKE_SCHEMA = z.coerce.string().regex(/^\d*$/gm);

const OPTIONAL_STRING_SCHEMA = z.string().optional();

// * By default, dotenv populates missing values with empty strings - minimum length should not be used for optional fields
const envSchema = z
    .object({
        // === CORE CONFIGURATION ===
        MINECRAFT_EMAIL: z.string().email(),
        MINECRAFT_PASSWORD: OPTIONAL_STRING_SCHEMA,
        HYPIXEL_API_KEY: z.string(),
        FALLBACK_HYPIXEL_API_KEY: z.string(),
        '2ND_FALLBACK_HYPIXEL_API_KEY': z.string(),
        HYPIXEL_GUILD_NAME: z.string(),
        MINECRAFT_CHAT_SEPARATOR: z.string().trim().min(1),
        USE_PROFANITY_FILTER: BOOLEAN_SCHEMA,
        USE_FIRST_WORD_OF_AUTHOR_NAME: BOOLEAN_SCHEMA,
        MINIMUM_NETWORK_LEVEL: z.coerce.number().min(0).default(0),
        REMINDER_ENABLED: BOOLEAN_SCHEMA,
        REMINDER_MESSAGE: z.string().max(256),
        REMINDER_FREQUENCY: z.coerce.number().int().positive().default(60),
        MINECRAFT_RECONNECT_DELAY: z.coerce.number().int().positive().default(10),

        // === DISCORD CONFIGURATION ===
        DISCORD_TOKEN: z.string().min(1),
        DISCORD_IGNORE_PREFIX: z.string().trim().min(1),
        DISCORD_INVITE_LINK: z.string().startsWith('discord.gg/'),
        DISCORD_SERVER_ID: SNOWFLAKE_SCHEMA,
        MEMBER_CHANNEL_ID: SNOWFLAKE_SCHEMA,
        OFFICER_CHANNEL_ID: SNOWFLAKE_SCHEMA,
        BLACKLIST_CHANNEL_ID: SNOWFLAKE_SCHEMA,
        BOT_OWNER_ID: SNOWFLAKE_SCHEMA,
        STAFF_ROLE_ID: SNOWFLAKE_SCHEMA,

        // === STAFF MANAGEMENT SETTINGS ===
        BAN_ALLOWED_RANKS: OPTIONAL_STRING_SCHEMA,
        BAN_CHECK_INTERVAL: z.coerce.number().int().min(1).default(10), // Minutes between ban enforcement checks
        URCHIN_JOIN_CHECK: BOOLEAN_SCHEMA.optional(), // Auto-check new members against Urchin blacklist

        // === TERMINAL REPL ===
        ENABLE_TERMINAL: BOOLEAN_SCHEMA.optional(),

        // === COOLDOWN SETTINGS ===
        // RANK_1 is lowest, RANK_LEADER is highest
        COOLDOWN_RANK_1: z.coerce.number().int().min(0).default(60),
        COOLDOWN_RANK_2: z.coerce.number().int().min(0).default(20),
        COOLDOWN_RANK_3: z.coerce.number().int().min(0).default(15),
        COOLDOWN_RANK_4: z.coerce.number().int().min(0).default(12),
        COOLDOWN_RANK_5: z.coerce.number().int().min(0).default(10),
        COOLDOWN_LEADER: z.coerce.number().int().min(0).default(0),
        COOLDOWN_URCHIN: z.coerce.number().int().min(0).default(5),

        RANK_1: z.string().default(''),
        RANK_2: z.string().default(''),
        RANK_3: z.string().default(''),
        RANK_4: z.string().default(''),
        RANK_5: z.string().default('Leader'),
        RANK_LEADER: z.string().default('Guild Master'),
    })
    .refine((data) => !data.REMINDER_ENABLED || data.REMINDER_MESSAGE.trim() !== '', {
        message: 'Reminders are enabled but a message has not been set',
        path: ['REMINDER_MESSAGE'],
    });

config();
const env = envSchema.safeParse(process.env);

if (!env.success) {
    consola.error('Invalid configuration:', env.error.format());
    process.exit(1);
}

export default env.data!;
