declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MINECRAFT_EMAIL: string;
            MINECRAFT_PASSWORD: ?string;
            MINECRAFT_VERSION: string;

            SERVER_ADDRESS: string;
            HYPIXEL_API_KEY: string;

            MINECRAFT_CHAT_SEPARATOR: string;

            USE_FIRST_WORD_OF_AUTHOR_NAME: 'true' | 'false';

            MINIMUM_NETWORK_LEVEL: string;

            REMINDER_ENABLED: 'true' | 'false';
            REMINDER_MESSAGE: string;
            REMINDER_FREQUENCY: string;

            DISCORD_TOKEN: string;
            DISCORD_IGNORE_PREFIX: string;
            DISCORD_INVITE_LINK: `discord.gg/${string}`;
            USE_RANK_EMOJIS: 'true' | 'false';

            DISCORD_SERVER_ID: string;
            MEMBER_CHANNEL_ID: string;
            OFFICER_CHANNEL_ID: string;
            BLACKLIST_CHANNEL_ID: string;
            ERROR_CHANNEL_ID: string;

            BOT_OWNER_ID: string;
            STAFF_ROLE_ID: string;
        }
    }
}

export {};
