import logger from 'consola';
import { config } from 'dotenv';
import { z } from 'zod';

const BOOLEAN_SCHEMA = z
    .string()
    .toLowerCase()
    .transform((x) => x === 'true')
    .pipe(z.boolean());

const SNOWFLAKE_SCHEMA = z.coerce.string().regex(/^\d*$/gm);

const envSchema = z
    .object({
        MINECRAFT_EMAIL: z.string().email(),
        MINECRAFT_PASSWORD: z.string(), // no minimum length allows for manual authorization - dotenv populates an empty string by default
        HYPIXEL_API_KEY: z.string().min(1),
        MINECRAFT_CHAT_SEPARATOR: z.string().trim().min(1),
        USE_PROFANITY_FILTER: BOOLEAN_SCHEMA,
        USE_FIRST_WORD_OF_AUTHOR_NAME: BOOLEAN_SCHEMA,
        MINIMUM_NETWORK_LEVEL: z.coerce.number().min(0).default(0),
        REMINDER_ENABLED: BOOLEAN_SCHEMA,
        REMINDER_MESSAGE: z.string().max(256),
        REMINDER_FREQUENCY: z.coerce.number().int().positive().default(60),
        DISCORD_TOKEN: z.string().min(1),
        DISCORD_IGNORE_PREFIX: z.string().trim().min(1),
        DISCORD_INVITE_LINK: z.string().startsWith('discord.gg/'),
        DISCORD_SERVER_ID: SNOWFLAKE_SCHEMA,
        MEMBER_CHANNEL_ID: SNOWFLAKE_SCHEMA,
        OFFICER_CHANNEL_ID: SNOWFLAKE_SCHEMA,
        BLACKLIST_CHANNEL_ID: SNOWFLAKE_SCHEMA,
        ERROR_CHANNEL_ID: SNOWFLAKE_SCHEMA,
        BOT_OWNER_ID: SNOWFLAKE_SCHEMA,
        STAFF_ROLE_ID: SNOWFLAKE_SCHEMA,
        HYPIXEL_GUILD_NAME: z.string().min(1),
        DISCORD_BOT_ID: SNOWFLAKE_SCHEMA,
        COMMAND_COOLDOWN_MEMBER: z.coerce.number().int().positive().default(30000),
        COMMAND_COOLDOWN_ACTIVE: z.coerce.number().int().positive().default(15000),
    })
    .refine((data) => !data.REMINDER_ENABLED || data.REMINDER_MESSAGE.trim() !== '', {
        message: 'Reminders are enabled but a message has not been set',
        path: ['REMINDER_MESSAGE'],
    });

config();
const env = envSchema.safeParse(process.env);

if (!env.success) {
    logger.fatal('Invalid configuration:', env.error.formErrors.fieldErrors);
    process.exit(1);
}

export default env.data!;
