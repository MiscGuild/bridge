/**
 * GEXP Stats Extension
 *
 * Provides guild experience (GEXP) statistics for players including:
 * - Weekly total GEXP
 * - Daily average GEXP
 * - Detailed breakdown of weekly performance
 *
 * Command: !gexp [username]
 *
 * Configuration Options:
 * - enabled: Enable/disable the extension (default: true)
 * - guildRankCooldowns: Guild rank-based cooldown mappings in seconds
 *   - Guild Master: 0s (no cooldown)
 *   - Leader: 10s
 *   - Moderator: 20s
 *   - Member: 60s
 *
 * @author MiscGuild Bridge Bot Team
 * @version 1.0.0
 */

// Local type definitions
interface ChatMessageContext {
    message: string;
    username: string;
    channel?: 'Guild' | 'Officer' | 'From' | 'Party' | string;
    rank?: string;
    guildRank?: string;
    timestamp: Date;
    raw: string;
    matches?: RegExpMatchArray;
}

interface ExtensionAPI {
    log: any;
    events: any;
    config: any;
    chat: {
        sendGuildChat: (message: string) => void;
        sendOfficerChat: (message: string) => void;
        sendPrivateMessage: (username: string, message: string) => void;
        sendPartyMessage: (message: string) => void;
    };
    discord: {
        send: (channelId: string, content: any, color?: number, ping?: boolean) => Promise<any>;
        sendMessage: (channelId: string, content: any) => Promise<any>;
        sendEmbed: (channelId: string, embed: any) => Promise<any>;
    };
    utils: Record<string, any>;
}

interface ChatPattern {
    id: string;
    extensionId: string;
    pattern: RegExp;
    priority: number;
    description: string;
    handler: (context: ChatMessageContext, api: ExtensionAPI) => Promise<void>;
}

interface FetchError {
    status: number;
    statusText: string;
}

interface MojangProfile {
    id: string;
    name: string;
}

// Utility functions
const getRandomHexColor = (): string => {
    const hex = Math.floor(Math.random() * 0xffffffff)
        .toString(16)
        .padStart(8, '0');
    return `#${hex}`;
};

const isFetchError = (response: any): response is FetchError => {
    return (
        response && typeof response.status === 'number' && typeof response.statusText === 'string'
    );
};

/**
 * Fetch Mojang profile by username
 */
const fetchMojangProfile = async (username: string): Promise<MojangProfile | FetchError> => {
    try {
        const response = await fetch(
            `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`,
            {
                headers: {
                    'User-Agent': 'MiscellaneousBridge/2.6 (info@vliegenier04.dev)',
                    Accept: 'application/json',
                },
            }
        );

        if (response.status === 204) {
            return {
                status: 204,
                statusText: 'Player not found',
            };
        }

        if (response.status === 200) {
            const data: any = await response.json();
            return { id: data.id, name: data.name };
        }

        return {
            status: response.status,
            statusText: response.statusText,
        };
    } catch (error) {
        return {
            status: 500,
            statusText: 'Network error',
        };
    }
};

interface ExpHistory {
    [date: string]: number;
}

interface GuildMember {
    uuid: string;
    rank: string;
    joined: number;
    questParticipation?: number;
    expHistory?: ExpHistory;
}

interface HypixelGuild {
    _id: string;
    name: string;
    members: GuildMember[];
    tag?: string;
    tagColor?: string;
}

interface FetchError {
    status: number;
    statusText: string;
}

class GEXPStatsExtension {
    manifest = {
        id: 'gexp-stats',
        name: 'GEXP Stats Checker',
        version: '1.0.0',
        description: 'Check guild experience (GEXP) statistics for players',
        author: 'MiscGuild Bridge Bot Team',
    };

    private config: any = {};
    private api: ExtensionAPI | null = null;

    // Cooldown tracking
    private cooldowns: Map<string, number> = new Map();
    private processingRequests: Set<string> = new Set();
    private cleanupInterval: NodeJS.Timeout | null = null;

    // Helper to build cooldowns from environment
    private buildGuildRankCooldowns(): Record<string, number> {
        const cooldowns: Record<string, number> = {};

        // Use environment variable rank names
        if (process.env.RANK_1)
            cooldowns[process.env.RANK_1] = parseInt(process.env.COOLDOWN_RANK_1!);
        if (process.env.RANK_2)
            cooldowns[process.env.RANK_2] = parseInt(process.env.COOLDOWN_RANK_2!);
        if (process.env.RANK_3)
            cooldowns[process.env.RANK_3] = parseInt(process.env.COOLDOWN_RANK_3!);
        if (process.env.RANK_4)
            cooldowns[process.env.RANK_4] = parseInt(process.env.COOLDOWN_RANK_4!);
        if (process.env.RANK_5)
            cooldowns[process.env.RANK_5] = parseInt(process.env.COOLDOWN_RANK_5!);
        if (process.env.RANK_LEADER)
            cooldowns[process.env.RANK_LEADER] = parseInt(process.env.COOLDOWN_LEADER!);

        // Add common variations
        cooldowns['GM'] = parseInt(process.env.COOLDOWN_LEADER!);
        cooldowns['Moderator'] = parseInt(process.env.COOLDOWN_RANK_2!);

        return cooldowns;
    }

    // Default configuration
    private get defaultConfig() {
        return {
            enabled: true,
            hypixelApiKey: process.env.HYPIXEL_API_KEY || '',
            cleanupInterval: 5 * 60 * 1000, // Clean up old cooldowns every 5 minutes
            guildRankCooldowns: this.buildGuildRankCooldowns(),
        };
    }

    /**
     * Initialize the extension
     */
    async init(context: any, api: ExtensionAPI): Promise<void> {
        this.config = { ...this.defaultConfig, ...api.config };
        this.api = api;

        api.log.info('Initializing GEXP Stats Extension...');

        if (!this.config.enabled) {
            api.log.warn('GEXP Stats Extension is disabled in config');
            return;
        }

        if (!this.config.hypixelApiKey) {
            api.log.error(
                'Hypixel API key not found! Please set HYPIXEL_API_KEY environment variable'
            );
            return;
        }

        // Start cooldown cleanup interval
        this.startCooldownCleanup();

        api.log.success('GEXP Stats Extension initialized successfully');
    }

    /**
     * Send message to correct channel
     */
    private sendToChannel(context: ChatMessageContext, api: ExtensionAPI, message: string): void {
        if (context.channel === 'Officer') {
            api.chat.sendOfficerChat(message);
        } else if (context.channel === 'Guild') {
            api.chat.sendGuildChat(message);
        } else {
            api.chat.sendPrivateMessage(context.username, message);
        }
    }

    /**
     * Generate chat patterns
     */
    getChatPatterns(): ChatPattern[] {
        return [
            {
                id: 'gexp-stats',
                extensionId: 'gexp-stats',
                pattern: /^!gexp(?:\s+([A-Za-z0-9_]{1,16}))?/i,
                priority: 1,
                description: 'Check GEXP statistics for a player',
                handler: this.handleGEXPCommand.bind(this),
            },
        ];
    }

    /**
     * Handle GEXP command
     */
    private async handleGEXPCommand(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        if (!this.config.enabled) return;

        const requester = context.username;
        const target = context.matches?.[1]?.trim() || requester;
        const requestKey = `${requester}-${target}-gexp`;

        // Prevent multiple simultaneous requests
        if (this.processingRequests.has(requestKey)) {
            api.log.debug(`⏳ Ignoring duplicate GEXP request: ${requestKey}`);
            return;
        }

        // Check cooldown
        const cooldownRemaining = this.isOnCooldown(requester, context.guildRank, Date.now());
        if (cooldownRemaining !== null && cooldownRemaining > 0) {
            const message = `${requester}, you can only use this command again in ${cooldownRemaining} seconds. Please wait. | ${getRandomHexColor()}`;
            this.sendToChannel(context, api, message);
            return;
        } // Mark request as processing and set cooldown
        this.processingRequests.add(requestKey);
        this.setCooldown(requester, Date.now());

        api.log.info(`Looking up GEXP stats for ${target} (requested by ${requester})`);

        try {
            // Fetch Mojang profile
            const mojangProfile = await fetchMojangProfile(target);
            if (isFetchError(mojangProfile)) {
                this.handleFetchError(mojangProfile, requester, target, api, context);
                return;
            }

            // Fetch guild data
            const guild = await this.fetchHypixelGuild(mojangProfile.id);
            if (isFetchError(guild)) {
                this.handleFetchError(guild, requester, target, api, context);
                return;
            }

            if (!guild) {
                const message = `${requester}, the player ${target} is not in a guild. | ${getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                return;
            }

            // Find guild member
            const guildMember = guild.members.find((m: GuildMember) => m.uuid === mojangProfile.id);
            if (!guildMember) {
                const message = `${requester}, ${target} is not found in their guild. | ${getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                return;
            }

            // Build and send GEXP message
            const gexpMessage = this.buildGEXPMessage(target, guildMember.expHistory);
            this.sendToChannel(context, api, gexpMessage);

            api.log.success(`Sent GEXP stats for ${target}`);
        } catch (error) {
            api.log.error(`Error fetching GEXP stats:`, error);
            const errorMessage = `${requester}, An error occurred while fetching GEXP stats for ${target}. Please try again later. | ${getRandomHexColor()}`;
            this.sendToChannel(context, api, errorMessage);
        } finally {
            // Always cleanup the processing flag
            this.processingRequests.delete(requestKey);
        }
    }

    /**
     * Build GEXP statistics message
     */
    private buildGEXPMessage(playerName: string, expHistory?: ExpHistory): string {
        if (!expHistory || typeof expHistory !== 'object') {
            return `[GEXP] IGN: ${playerName} | No GEXP data found. Player may not have been active in the past 7 days. | ${getRandomHexColor()}`;
        }

        // Get GEXP values for the past 7 days
        const gexpValues = Object.keys(expHistory)
            .sort()
            .map((date) => expHistory[date] ?? 0);

        if (gexpValues.length === 0) {
            return `[GEXP] IGN: ${playerName} | No GEXP data found. Player may not have been active in the past 7 days. | ${getRandomHexColor()}`;
        }

        // Calculate statistics
        const weeklyTotal = gexpValues.reduce((acc, curr) => acc + curr, 0);
        const dailyAverage = weeklyTotal / 7;
        const todayGexp = gexpValues[gexpValues.length - 1] || 0;

        // Format numbers
        const weeklyFormatted = this.formatNumber(weeklyTotal);
        const dailyFormatted = this.formatNumber(Math.round(dailyAverage));
        const todayFormatted = this.formatNumber(todayGexp);

        return `[GEXP] IGN: ${playerName} | Weekly: ${weeklyFormatted} | Daily: ${todayFormatted} | AVG: ${dailyFormatted} | ${getRandomHexColor()}`;
    }

    /**
     * Fetch Hypixel guild data
     */
    private async fetchHypixelGuild(uuid: string): Promise<HypixelGuild | FetchError> {
        try {
            const response = await fetch(
                `https://api.hypixel.net/guild?key=${this.config.hypixelApiKey}&player=${uuid}`
            );

            if (response.status === 200) {
                const data: any = await response.json();
                if (data && data.guild !== null) {
                    return data.guild as HypixelGuild;
                }
                return {
                    status: 404,
                    statusText: 'Player not found in any guild',
                };
            }

            return {
                status: response.status,
                statusText: response.statusText,
            };
        } catch (error) {
            return {
                status: 500,
                statusText: 'Network error',
            };
        }
    }

    /**
     * Format numbers with K/M suffixes
     */
    private formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    /**
     * Handle fetch errors
     */
    private handleFetchError(
        error: FetchError,
        requester: string,
        target: string,
        api: ExtensionAPI,
        context: ChatMessageContext
    ): void {
        let message: string;

        if (error.status === 404) {
            message = `${requester}, Player "${target}" not found. Please check the spelling. | ${getRandomHexColor()}`;
        } else if (error.status === 429) {
            message = `${requester}, Rate limited. Please try again later. | ${getRandomHexColor()}`;
        } else {
            message = `${requester}, API error occurred while fetching data for ${target}. Please try again later. | ${getRandomHexColor()}`;
        }

        this.sendToChannel(context, api, message);
        api.log.warn(`Fetch error for ${target}: ${error.status} - ${error.statusText}`);
    }

    /**
     * Check if user is on cooldown based on guild rank
     */
    private isOnCooldown(
        playerName: string,
        guildRank: string | undefined,
        now: number
    ): number | null {
        // Get guild rank cooldowns configuration
        const rankCooldowns =
            this.config.guildRankCooldowns || this.defaultConfig.guildRankCooldowns;
        let cooldownSeconds: number | undefined;

        // Debug logging
        if (this.api) {
            this.api.log.debug(`Checking cooldown for ${playerName} with rank: ${guildRank}`);
            this.api.log.debug(`Available cooldowns: ${JSON.stringify(rankCooldowns)}`);
        }

        // Check for exact guild rank match first (without brackets)
        const cleanRank = guildRank?.replace(/[[\]]/g, '');
        if (cleanRank && rankCooldowns[cleanRank] !== undefined) {
            cooldownSeconds = rankCooldowns[cleanRank];
        }

        // Default to RANK_1 (lowest rank) cooldown if no rank detected
        if (cooldownSeconds === undefined) {
            cooldownSeconds = parseInt(process.env.COOLDOWN_RANK_1 || '60');
        }

        // No cooldown if set to 0
        if (cooldownSeconds === 0) {
            return null;
        }

        const cooldownTime = cooldownSeconds! * 1000; // Convert to milliseconds
        const lastRun = this.cooldowns.get(playerName);
        if (lastRun && now - lastRun < cooldownTime) {
            return Math.ceil((cooldownTime - (now - lastRun)) / 1000);
        }

        return null;
    }

    /**
     * Set cooldown for user
     */
    private setCooldown(playerName: string, now: number): void {
        this.cooldowns.set(playerName, now);
    }

    /**
     * Start the cooldown cleanup interval
     */
    private startCooldownCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldCooldowns();
        }, this.config.cleanupInterval);
    }

    /**
     * Clean up old cooldowns to prevent memory leaks
     */
    private cleanupOldCooldowns(): void {
        const now = Date.now();
        const maxAge = 10 * 60 * 1000; // 10 minutes

        for (const [playerName, timestamp] of this.cooldowns.entries()) {
            if (now - timestamp > maxAge) {
                this.cooldowns.delete(playerName);
            }
        }

        if (this.config.debugMode && this.api) {
            this.api.log.debug(
                `Cleaned up old GEXP cooldowns, ${this.cooldowns.size} active cooldowns remaining`
            );
        }
    }

    /**
     * Cleanup
     */
    async destroy(): Promise<void> {
        // Clear the cleanup interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        // Clear all cooldowns and processing requests
        this.cooldowns.clear();
        this.processingRequests.clear();
        this.api?.log.info('GEXP Stats Extension destroyed');
    }
}

module.exports = GEXPStatsExtension;
