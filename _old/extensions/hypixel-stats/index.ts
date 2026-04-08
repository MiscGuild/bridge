/**
 * Hypixel Stats Extension v2.0 - Modular Multi-Game Support
 *
 * Provides comprehensive Hypixel stats checking functionality for all major game modes.
 * Each game mode has its own dedicated handler with specialized stat calculations.
 *
 * Supported Games:
 * - !bw [username] - Bedwars stats
 * - !sw [username] - SkyWars stats
 * - !duels [username] - Duels stats
 * - !uhc [username] - UHC Champions stats
 * - !bb [username] - Build Battle stats
 * - !mm [username] - Murder Mystery stats
 * - !tnt [username] - TNT Games stats
 * - !mw [username] - Mega Walls stats
 * - !arcade [username] - Arcade Games stats
 *
 * Configuration Options:
 * - enabled: Enable/disable the extension (default: true)
 * - debugMode: Enable debug logging (default: false)
 * - guildRankCooldowns: Guild rank-based cooldown mappings in seconds
 *   - Guild Master: 0s (no cooldown)
 *   - Leader: 15s
 *   - Moderator: 30s
 *   - Member: 60s
 *
 * @author MiscGuild Bridge Bot Team
 * @version 2.0.0
 */

import { ChatMessageContext, ExtensionAPI, ChatPattern } from './types';
import { allHandlers } from './handlers';
import {
    getRandomHexColor,
    fetchMojangProfile,
    fetchHypixelPlayerProfile,
    fetchSkyblockProfiles,
    isFetchError,
} from './utils';

// Cache entry interface
interface CacheEntry {
    data: any;
    timestamp: number;
    expiresAt: number;
}

class HypixelStatsExtension {
    manifest = {
        id: 'hypixel-stats',
        name: 'Hypixel Stats Checker v2.0',
        version: '2.0.0',
        description: 'Comprehensive multi-game Hypixel stats checking with modular handlers',
        author: 'MiscGuild Bridge Bot Team',
    };

    private config: any = {};
    private botContext: any;
    private api: ExtensionAPI | null = null;

    // Cooldown tracking
    private cooldowns: Map<string, number> = new Map();
    private processingRequests: Set<string> = new Set(); // Track ongoing requests
    private cleanupInterval: NodeJS.Timeout | null = null;

    // Cache system for API responses (15 minute cache)
    private cache: Map<string, CacheEntry> = new Map();
    private cacheCleanupInterval: NodeJS.Timeout | null = null;

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
            hypixelApiKey: process.env.HYPIXEL_API_KEY,
            debugMode: false,
            cleanupInterval: 5 * 60 * 1000, // Clean up old cooldowns every 5 minutes
            cacheExpiryTime: 15 * 60 * 1000, // Cache expires after 15 minutes
            cacheCleanupInterval: 5 * 60 * 1000, // Clean up expired cache entries every 5 minutes
            guildRankCooldowns: this.buildGuildRankCooldowns(),
        };
    }

    /**
     * Initialize the extension
     */
    async init(context: any, api: ExtensionAPI): Promise<void> {
        this.config = { ...this.defaultConfig, ...api.config };
        this.botContext = context;
        this.api = api;

        api.log.info('Initializing Hypixel Stats Extension v2.0...');

        if (!this.config.enabled) {
            api.log.warn('Hypixel Stats Extension is disabled in config');
            return;
        }

        if (!this.config.hypixelApiKey) {
            api.log.error(
                'Hypixel API key not found! Please set HYPIXEL_API_KEY environment variable'
            );
            return;
        }

        api.log.info(
            `Loaded ${allHandlers.length} game mode handlers: ${allHandlers.map((h) => h.gameMode).join(', ')}`
        );

        // Start cooldown cleanup interval
        this.startCooldownCleanup();

        // Start cache cleanup interval
        this.startCacheCleanup();

        api.log.success('Hypixel Stats Extension v2.0 initialized successfully');
    }

    /**
     * Generate chat patterns for all supported game modes
     */
    getChatPatterns(): ChatPattern[] {
        const patterns: ChatPattern[] = [];

        // Add !hypixel command for general player info
        patterns.push({
            id: 'hypixel-general-info',
            extensionId: 'hypixel-stats',
            pattern: /^!hypixel(?:\s+([A-Za-z0-9_]{1,16}))?$/i,
            priority: 1,
            description: 'Check general Hypixel player information',
            handler: this.handleHypixelGeneralInfo.bind(this),
        });

        // Add !help command
        patterns.push({
            id: 'hypixel-help',
            extensionId: 'hypixel-stats',
            pattern: /^!help$/i,
            priority: 1,
            description: 'Show available Hypixel stats commands',
            handler: this.handleHelpCommand.bind(this),
        });

        // Add !guild command for guild lookup
        patterns.push({
            id: 'guild-lookup',
            extensionId: 'hypixel-stats',
            pattern: /^!guild(?:\s+([A-Za-z0-9_]{1,16}))?$/i,
            priority: 1,
            description: 'Check what guild a player is in',
            handler: this.handleGuildLookup.bind(this),
        });

        // Add !networth updateplugin command (restricted to Mod, Leader, GM)
        patterns.push({
            id: 'networth-update-plugin',
            extensionId: 'hypixel-stats',
            pattern: /^!networth\s+updateplugin\b/i,
            priority: 1,
            description: 'Update the networth calculation library (Staff only)',
            handler: this.handleNetworthUpdatePlugin.bind(this),
        });

        // Create patterns for handlers
        // The handler.command field now directly represents what the user types (without !)
        // Examples: 'bw', 'bw solo', 'bw 4s', 'sb skills', 'sw'
        allHandlers.forEach((handler) => {
            let priority: number;

            // Collect all command variants (main command + aliases)
            const commandVariants = [handler.command];
            if (handler.aliases && handler.aliases.length > 0) {
                commandVariants.push(...handler.aliases);
            }

            // Check if this is a command with spaces (subcommand)
            const hasSpace = handler.command.includes(' ');

            if (hasSpace) {
                // Subcommand: 'bw solo', 'sb skills', etc.
                // Create pattern that matches any of the command variants
                const escapedCommands = commandVariants.map((cmd) => cmd.replace(/\s+/g, '\\s+'));
                const pattern = new RegExp(
                    `^!(?:${escapedCommands.join('|')})(?:\\s+([A-Za-z0-9_]{1,16}))?$`,
                    'i'
                );
                priority = 5; // LOWER number = HIGHER priority (checked first)

                patterns.push({
                    id: `${handler.gameMode.toLowerCase()}-${handler.command.replace(/\s+/g, '-')}-stats`,
                    extensionId: 'hypixel-stats',
                    pattern: pattern,
                    priority: priority,
                    description: handler.description,
                    handler:
                        handler.gameMode.startsWith('SkyBlock') ||
                        handler.gameMode.includes('Networth')
                            ? this.createSkyBlockStatsHandler(handler).bind(this)
                            : this.createStatsHandler(handler).bind(this),
                });
            } else {
                // Base command: 'bw', 'sb', 'sw', etc.
                // For commands that have subcommands (bw, sb), use negative lookahead
                let pattern: RegExp;
                if (handler.command === 'bw') {
                    // Exclude known Bedwars subcommands
                    pattern = new RegExp(
                        `^!bw(?:\\s+(?!(?:solo|1s|solos|doubles|2s|duos|threes|3s|3v3|trios|fours|4s|4v4v4v4|quads|4v4)(?:\\s|$))([A-Za-z0-9_]{1,16}))?$`,
                        'i'
                    );
                    priority = 20; // HIGHER number = LOWER priority (checked last)
                } else if (handler.command === 'sb') {
                    // Exclude known SkyBlock subcommands
                    pattern = new RegExp(
                        `^!sb(?:\\s+(?!(?:skills|slayers|dungeons|collections|networth)(?:\\s|$))([A-Za-z0-9_]{1,16}))?$`,
                        'i'
                    );
                    priority = 20;
                } else {
                    // Regular command without subcommands
                    pattern = new RegExp(`^!${handler.command}(?:\\s+([A-Za-z0-9_]{1,16}))?$`, 'i');
                    priority = 10;
                }

                patterns.push({
                    id: `${handler.gameMode.toLowerCase()}-${handler.command.replace(/\s+/g, '-')}-stats`,
                    extensionId: 'hypixel-stats',
                    pattern: pattern,
                    priority: priority,
                    description: handler.description,
                    handler:
                        handler.gameMode.startsWith('SkyBlock') ||
                        handler.gameMode.includes('Networth')
                            ? this.createSkyBlockStatsHandler(handler).bind(this)
                            : this.createStatsHandler(handler).bind(this),
                });
            }
        });

        return patterns;
    }

    /**
     * Handle !hypixel command for general player information
     */
    private async handleHypixelGeneralInfo(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!this.config.enabled) return;

        const requester = context.username;
        const target = context.matches?.[1]?.trim() || requester;
        const requestKey = `${requester}-${target}-hypixel`;

        // Prevent multiple simultaneous requests
        if (this.processingRequests.has(requestKey)) {
            api.log.debug(`⏳ Ignoring duplicate request: ${requestKey}`);
            return;
        }

        // Check cooldown
        const cooldownRemaining = this.isOnCooldown(requester, context.guildRank, Date.now());
        if (cooldownRemaining !== null && cooldownRemaining > 0) {
            const message = `${requester}, you can only use this command again in ${cooldownRemaining} seconds. Please wait. | ${getRandomHexColor()}`;
            api.chat.sendGuildChat(message);
            return;
        }

        // Mark request as processing and set cooldown
        this.processingRequests.add(requestKey);
        this.setCooldown(requester, Date.now());

        api.log.info(`Looking up general Hypixel info for ${target} (requested by ${requester})`);

        try {
            // Check cache for Mojang profile
            const mojangCacheKey = this.generateCacheKey('mojang', target);
            let mojangProfile = this.getCachedData(mojangCacheKey);

            if (!mojangProfile) {
                // Fetch Mojang profile
                mojangProfile = await fetchMojangProfile(target);
                if (isFetchError(mojangProfile)) {
                    this.handleFetchError(mojangProfile, requester, target, api);
                    this.processingRequests.delete(requestKey);
                    return;
                }
                this.setCachedData(mojangCacheKey, mojangProfile);
            }

            // Check cache for Hypixel player data
            const playerCacheKey = this.generateCacheKey('player', mojangProfile.id);
            let playerData = this.getCachedData(playerCacheKey);

            if (!playerData) {
                // Fetch Hypixel player data
                playerData = await fetchHypixelPlayerProfile(
                    mojangProfile.id,
                    this.config.hypixelApiKey
                );
                if (isFetchError(playerData)) {
                    this.handleFetchError(playerData, requester, target, api);
                    this.processingRequests.delete(requestKey);
                    return;
                }
                this.setCachedData(playerCacheKey, playerData);
            }

            // Build general info message
            const message = this.buildGeneralInfoMessage(target, playerData);
            this.sendToChannel(context, api, message);

            api.log.success(`Sent general Hypixel info for ${target}`);
        } catch (error) {
            api.log.error(`Error fetching general Hypixel info:`, error);
            const errorMessage = `${requester}, An error occurred while fetching Hypixel info for ${target}. Please try again later. | ${getRandomHexColor()}`;
            api.chat.sendGuildChat(errorMessage);
        } finally {
            this.processingRequests.delete(requestKey);
        }
    }

    /**
     * Handle !help command
     */
    private async handleHelpCommand(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        if (!this.config.enabled) return;

        const helpMessage = this.buildHelpMessage();
        this.sendToChannel(context, api, helpMessage);
    }

    /**
     * Handle !guild command for guild lookup
     */
    private async handleGuildLookup(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        if (!this.config.enabled) return;

        const requester = context.username;
        const target = context.matches?.[1]?.trim() || requester;
        const requestKey = `${requester}-${target}-guild`;

        // Prevent multiple simultaneous requests
        if (this.processingRequests.has(requestKey)) {
            api.log.debug(`⏳ Ignoring duplicate request: ${requestKey}`);
            return;
        }

        // Check cooldown
        const cooldownRemaining = this.isOnCooldown(requester, context.guildRank, Date.now());
        if (cooldownRemaining !== null && cooldownRemaining > 0) {
            const message = `${requester}, you can only use this command again in ${cooldownRemaining} seconds. Please wait. | ${getRandomHexColor()}`;
            this.sendToChannel(context, api, message);
            return;
        }

        // Mark request as processing and set cooldown
        this.processingRequests.add(requestKey);
        this.setCooldown(requester, Date.now());

        api.log.info(`Looking up guild for ${target} (requested by ${requester})`);

        try {
            // Check cache for Mojang profile
            const mojangCacheKey = this.generateCacheKey('mojang', target);
            let mojangProfile = this.getCachedData(mojangCacheKey);

            if (!mojangProfile) {
                mojangProfile = await fetchMojangProfile(target);
                if (isFetchError(mojangProfile)) {
                    this.handleFetchError(mojangProfile, requester, target, api);
                    this.processingRequests.delete(requestKey);
                    return;
                }
                this.setCachedData(mojangCacheKey, mojangProfile);
            }

            // Fetch guild data
            const guildResponse = await fetch(
                `https://api.hypixel.net/guild?player=${mojangProfile.id}&key=${this.config.hypixelApiKey}`
            );
            if (!guildResponse.ok) {
                const errorMessage = `${requester}, Failed to fetch guild data for ${target}. | ${getRandomHexColor()}`;
                this.sendToChannel(context, api, errorMessage);
                this.processingRequests.delete(requestKey);
                return;
            }

            const guildData: any = await guildResponse.json();

            if (!guildData.success || !guildData.guild) {
                const message = `${target} is not in a guild. | ${getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                api.log.info(`${target} is not in a guild`);
                this.processingRequests.delete(requestKey);
                return;
            }

            // Find the player's member data
            const member = guildData.guild.members?.find((m: any) => m.uuid === mojangProfile.id);
            const guildName = guildData.guild.name || 'Unknown';
            const guildTag = guildData.guild.tag ? `[${guildData.guild.tag}]` : '';
            const rank = member?.rank || 'Member';
            const joinedDate = member?.joined
                ? new Date(member.joined).toLocaleDateString()
                : 'Unknown';

            const message = `[Guild] ${target} is in ${guildTag} ${guildName} | Rank: ${rank} | Joined: ${joinedDate} | ${getRandomHexColor()}`;
            this.sendToChannel(context, api, message);

            api.log.success(`Sent guild info for ${target}`);
        } catch (error) {
            api.log.error(`Error fetching guild info:`, error);
            const errorMessage = `${requester}, An error occurred while fetching guild info for ${target}. Please try again later. | ${getRandomHexColor()}`;
            this.sendToChannel(context, api, errorMessage);
        } finally {
            this.processingRequests.delete(requestKey);
        }
    }

    /**
     * Handle !networth updateplugin command (restricted to staff)
     */
    private async handleNetworthUpdatePlugin(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!this.config.enabled) return;

        const requester = context.username;
        const userRank = context.guildRank || '';

        // Check if user has permission (Mod, Leader, GM)
        const allowedRanks = ['[Mod]', '[Leader]', '[GM]', '[Guild Master]'];
        const hasPermission = allowedRanks.some((rank) => userRank.includes(rank));

        if (!hasPermission) {
            const message = `Access denied ${requester}. Required rank: Mod, Leader, or GM. Your rank: ${userRank || 'Unknown'} | ${getRandomHexColor()}`;

            if (context.channel === 'Guild' || context.channel === 'Officer') {
                api.chat.sendGuildChat(message);
            } else if (context.channel === 'From') {
                api.chat.sendPrivateMessage(requester, message);
            }
            return;
        }

        // Start the update process
        const startMessage = `${requester} initiated networth plugin update...`;
        api.chat.sendGuildChat(startMessage);

        try {
            // Use child_process to run npm update command
            const { spawn } = require('child_process');

            api.log.info(`Networth plugin update initiated by ${requester} [${userRank}]`);

            const updateProcess = spawn('npm', ['update', 'skyhelper-networth'], {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            let _output = '';
            let errorOutput = '';

            updateProcess.stdout.on('data', (data: Buffer) => {
                _output += data.toString();
            });

            updateProcess.stderr.on('data', (data: Buffer) => {
                errorOutput += data.toString();
            });

            updateProcess.on('close', (code: number) => {
                if (code === 0) {
                    // Success - attempt to reload the module
                    try {
                        // Clear the require cache to reload the module
                        delete require.cache[require.resolve('skyhelper-networth')];

                        // Try to re-require the module to verify it works
                        const skyhelperNetworth = require('skyhelper-networth');
                        const version = skyhelperNetworth.version || 'Unknown';

                        const successMessage = `Networth plugin updated successfully by ${requester}! Version: ${version}`;
                        api.chat.sendGuildChat(successMessage);
                        api.log.success(`Networth plugin updated successfully by ${requester}`);
                    } catch (reloadError) {
                        const reloadErrorMessage = `Plugin updated but reload failed. Bot restart may be required. Error: ${reloadError}`;
                        api.chat.sendGuildChat(reloadErrorMessage);
                        api.log.warn(`Networth plugin reload failed: ${reloadError}`);
                    }
                } else {
                    const errorMessage = `Networth plugin update failed. Exit code: ${code}`;
                    api.chat.sendGuildChat(errorMessage);
                    api.log.error(
                        `Networth plugin update failed. Exit code: ${code}, Error: ${errorOutput}`
                    );
                }
            });

            updateProcess.on('error', (error: Error) => {
                const errorMessage = `Failed to start update process: ${error.message}`;
                api.chat.sendGuildChat(errorMessage);
                api.log.error(`Networth plugin update process error: ${error}`);
            });
        } catch (error) {
            const errorMessage = `Error updating networth plugin: ${error}`;
            api.chat.sendGuildChat(errorMessage);
            api.log.error(`Networth plugin update error: ${error}`);
        }
    }

    /**
     * Send message to correct channel based on context
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
     * Build general Hypixel player info message
     */
    private buildGeneralInfoMessage(playerName: string, playerData: any): string {
        const rank = this.getHypixelRank(playerData);
        const networkLevel = this.calculateNetworkLevel(playerData.networkExp || 0);
        const firstLogin = playerData.firstLogin
            ? new Date(playerData.firstLogin).toLocaleDateString()
            : 'Unknown';
        const _lastLogin = playerData.lastLogin
            ? new Date(playerData.lastLogin).toLocaleDateString()
            : 'Unknown';
        const achievements = playerData.achievementPoints || 0;
        const karma = playerData.karma || 0;

        return `[Hypixel] ${rank} ${playerName} | Level: ${networkLevel} | First Login: ${firstLogin} | Achievements: ${achievements} | Karma: ${karma} | ${getRandomHexColor()}`;
    }

    /**
     * Build help message showing available commands
     */
    private buildHelpMessage(): string {
        return `[Help] !hypixel !bw !sw !duels !uhc !bb !mm !tnt !mw !arcade !cvc !pit !guild [user] | SkyBlock: !sb [user] !sb skills/slayers/dungeons [user] | !networth armor/wardrobe/inv/storage/equip/pets | !view [user] !gexp [user] | ${getRandomHexColor()}`;
    }

    /**
     * Get Hypixel rank with proper formatting
     * Available ranks: Default, VIP, VIP+, MVP, MVP+, MVP++, Youtube, Admin
     */
    private getHypixelRank(playerData: any): string {
        // Check for staff ranks first (ADMIN, MODERATOR, HELPER, YOUTUBER)
        if (playerData.rank) {
            const rank = playerData.rank.toUpperCase();
            if (rank === 'ADMIN') return '[ADMIN]';
            if (rank === 'MODERATOR') return '[MOD]';
            if (rank === 'HELPER') return '[HELPER]';
            if (rank === 'YOUTUBER') return '[YOUTUBE]';
            return `[${playerData.rank}]`;
        }

        // Check for MVP++ (monthly package rank - superstar)
        if (playerData.monthlyPackageRank === 'SUPERSTAR') {
            return '[MVP++]';
        }

        // Check for regular ranks (VIP, VIP+, MVP, MVP+)
        if (playerData.newPackageRank) {
            const rank = playerData.newPackageRank;
            if (rank === 'VIP') return '[VIP]';
            if (rank === 'VIP_PLUS') return '[VIP+]';
            if (rank === 'MVP') return '[MVP]';
            if (rank === 'MVP_PLUS') return '[MVP+]';
        }

        // Fallback to packageRank if newPackageRank doesn't exist
        if (playerData.packageRank) {
            const rank = playerData.packageRank;
            if (rank === 'VIP') return '[VIP]';
            if (rank === 'VIP_PLUS') return '[VIP+]';
            if (rank === 'MVP') return '[MVP]';
            if (rank === 'MVP_PLUS') return '[MVP+]';
        }

        return '[DEFAULT]';
    }

    /**
     * Calculate Hypixel network level using official formula
     */
    private calculateNetworkLevel(networkExp: number): number {
        if (networkExp < 0) return 1;

        // Official Hypixel formula: (sqrt(2 * exp + 30625) - 175) / 50 + 1
        const level = (Math.sqrt(2 * networkExp + 30625) - 175) / 50 + 1;

        return Math.floor(level);
    }

    /**
     * Create a stats handler for a specific game mode
     */
    private createStatsHandler(gameHandler: any) {
        return async (context: ChatMessageContext, api: ExtensionAPI): Promise<void> => {
            if (!this.config.enabled) return;

            const requester = context.username;
            const target = context.matches?.[1]?.trim() || requester;
            const requestKey = `${requester}-${target}-${gameHandler.gameMode}`;

            // Prevent multiple simultaneous requests from the same user for the same target
            if (this.processingRequests.has(requestKey)) {
                api.log.debug(`⏳ Ignoring duplicate request: ${requestKey}`);
                return;
            }

            // Check cooldown
            const cooldownRemaining = this.isOnCooldown(requester, context.guildRank, Date.now());
            if (cooldownRemaining !== null && cooldownRemaining > 0) {
                const message = `${requester}, you can only use this command again in ${cooldownRemaining} seconds. Please wait. | ${getRandomHexColor()}`;
                api.chat.sendGuildChat(message);
                return;
            }

            // Mark request as processing and set cooldown
            this.processingRequests.add(requestKey);
            this.setCooldown(requester, Date.now());

            api.log.info(
                `Looking up ${gameHandler.gameMode} stats for ${target} (requested by ${requester})`
            );

            try {
                // Check cache for Mojang profile
                const mojangCacheKey = this.generateCacheKey('mojang', target);
                let mojangProfile = this.getCachedData(mojangCacheKey);

                if (!mojangProfile) {
                    // Fetch Mojang profile
                    mojangProfile = await fetchMojangProfile(target);
                    if (isFetchError(mojangProfile)) {
                        this.handleFetchError(mojangProfile, requester, target, api);
                        this.processingRequests.delete(requestKey);
                        return;
                    }
                    this.setCachedData(mojangCacheKey, mojangProfile);
                }

                // Check cache for Hypixel player data
                const playerCacheKey = this.generateCacheKey('player', mojangProfile.id);
                let playerData = this.getCachedData(playerCacheKey);

                if (!playerData) {
                    // Fetch Hypixel player data
                    playerData = await fetchHypixelPlayerProfile(
                        mojangProfile.id,
                        this.config.hypixelApiKey
                    );
                    if (isFetchError(playerData)) {
                        this.handleFetchError(playerData, requester, target, api);
                        this.processingRequests.delete(requestKey);
                        return;
                    }
                    this.setCachedData(playerCacheKey, playerData);
                }

                // Get game stats based on the handler's game mode
                const gameStats = playerData.stats?.[gameHandler.gameMode];

                // Build and send stats message using the handler's buildStatsMessage function
                const statsMessageResult = gameHandler.buildStatsMessage(
                    target,
                    playerData.achievements,
                    gameStats,
                    api
                );
                const statsMessage = await Promise.resolve(statsMessageResult); // Handle both sync and async
                this.sendToChannel(context, api, statsMessage);

                api.log.success(`Sent ${gameHandler.gameMode} stats for ${target}`);
            } catch (error) {
                api.log.error(`Error fetching ${gameHandler.gameMode} stats:`, error);
                const errorMessage = `${requester}, An error occurred while fetching ${gameHandler.gameMode} stats for ${target}. Please try again later. | ${getRandomHexColor()}`;
                api.chat.sendGuildChat(errorMessage);
            } finally {
                // Always cleanup the processing flag
                this.processingRequests.delete(requestKey);
            }
        };
    }

    /**
     * Create a special stats handler for SkyBlock commands that uses SkyBlock profiles API
     */
    private createSkyBlockStatsHandler(gameHandler: any) {
        return async (context: ChatMessageContext, api: ExtensionAPI): Promise<void> => {
            if (!this.config.enabled) return;

            if (this.config.debugMode) {
                api.log.info(`═══════════════════════════════════════`);
                api.log.info(`SKYBLOCK HANDLER CALLED!`);
                api.log.info(`═══════════════════════════════════════`);
            }

            const requester = context.username;
            const target = context.matches?.[1]?.trim() || requester;

            if (this.config.debugMode) {
                api.log.info(`Requester: ${requester}, Target: ${target}`);
            }
            const requestKey = `${requester}-${target}-${gameHandler.gameMode}`;

            // Prevent multiple simultaneous requests from the same user for the same target
            if (this.processingRequests.has(requestKey)) {
                api.log.debug(`⏳ Ignoring duplicate request: ${requestKey}`);
                return;
            }

            // Check cooldown
            const cooldownRemaining = this.isOnCooldown(requester, context.guildRank, Date.now());
            if (cooldownRemaining !== null && cooldownRemaining > 0) {
                const message = `${requester}, you can only use this command again in ${cooldownRemaining} seconds. Please wait. | ${getRandomHexColor()}`;
                api.chat.sendGuildChat(message);
                return;
            }

            // Mark request as processing and set cooldown
            this.processingRequests.add(requestKey);
            this.setCooldown(requester, Date.now());

            api.log.info(
                `Looking up ${gameHandler.gameMode} stats for ${target} (requested by ${requester})`
            );

            try {
                // Check cache for Mojang profile
                const mojangCacheKey = this.generateCacheKey('mojang', target);
                let mojangProfile = this.getCachedData(mojangCacheKey);

                if (!mojangProfile) {
                    // Fetch Mojang profile
                    mojangProfile = await fetchMojangProfile(target);
                    if (isFetchError(mojangProfile)) {
                        api.log.warn(
                            `Mojang API error for ${target}: ${mojangProfile.status} - ${mojangProfile.statusText}`
                        );
                        this.handleFetchError(mojangProfile, requester, target, api);
                        this.processingRequests.delete(requestKey);
                        return;
                    }
                    this.setCachedData(mojangCacheKey, mojangProfile);
                }

                api.log.debug(`Successfully got UUID for ${target}: ${mojangProfile.id}`);

                // Check cache for SkyBlock profiles data
                const skyblockCacheKey = this.generateCacheKey('skyblock', mojangProfile.id);
                let skyblockData = this.getCachedData(skyblockCacheKey);

                if (this.config.debugMode) {
                    api.log.info(
                        `[SkyBlock Debug] Starting SkyBlock data fetch for ${target} (UUID: ${mojangProfile.id})`
                    );
                    api.log.info(`[SkyBlock Debug] Cache key: ${skyblockCacheKey}`);
                    api.log.info(`[SkyBlock Debug] Cache ${skyblockData ? 'HIT' : 'MISS'}`);
                }

                if (!skyblockData) {
                    if (this.config.debugMode) {
                        api.log.info(
                            `[SkyBlock Debug] Cache miss - fetching fresh data for UUID: ${mojangProfile.id}`
                        );
                    }

                    // Fetch SkyBlock profiles data
                    skyblockData = await fetchSkyblockProfiles(
                        mojangProfile.id,
                        this.config.hypixelApiKey
                    );

                    if (this.config.debugMode) {
                        api.log.info(
                            `[SkyBlock Debug] Fetch completed, checking if error occurred`
                        );
                        api.log.info(`[SkyBlock Debug] Returned data type: ${typeof skyblockData}`);
                        api.log.info(
                            `[SkyBlock Debug] Is error check: ${isFetchError(skyblockData)}`
                        );
                    }

                    if (isFetchError(skyblockData)) {
                        if (this.config.debugMode) {
                            api.log.error(
                                `[SkyBlock Debug] Fetch returned error: ${skyblockData.status} - ${skyblockData.statusText}`
                            );
                        }
                        api.log.warn(
                            `SkyBlock API error for ${target}: ${skyblockData.status} - ${skyblockData.statusText}`
                        );
                        this.handleFetchError(skyblockData, requester, target, api);
                        this.processingRequests.delete(requestKey);
                        return;
                    }

                    if (this.config.debugMode) {
                        api.log.info(`[SkyBlock Debug] Fetch successful, caching data`);
                        api.log.info(
                            `[SkyBlock Debug] Data structure keys: ${Object.keys(skyblockData || {}).join(', ')}`
                        );
                        api.log.info(
                            `[SkyBlock Debug] Has memberData: ${!!skyblockData?.memberData}`
                        );
                        api.log.info(
                            `[SkyBlock Debug] memberData keys count: ${Object.keys(skyblockData?.memberData || {}).length}`
                        );
                    }

                    this.setCachedData(skyblockCacheKey, skyblockData);
                } else {
                    if (this.config.debugMode) {
                        api.log.info(
                            `[SkyBlock Debug] Cache hit - using cached data for ${target}`
                        );
                        api.log.info(
                            `[SkyBlock Debug] Cached data structure keys: ${Object.keys(skyblockData || {}).join(', ')}`
                        );
                        api.log.info(
                            `[SkyBlock Debug] Cached has memberData: ${!!skyblockData?.memberData}`
                        );
                        api.log.info(
                            `[SkyBlock Debug] Cached memberData keys count: ${Object.keys(skyblockData?.memberData || {}).length}`
                        );
                    }
                }

                api.log.debug(`Successfully got SkyBlock data for ${target}`);

                if (this.config.debugMode) {
                    api.log.info(
                        `[SkyBlock Debug] About to call buildStatsMessage for handler: ${gameHandler.gameMode}`
                    );
                    api.log.info(
                        `[SkyBlock Debug] memberData is ${skyblockData?.memberData ? 'present' : 'MISSING'}`
                    );
                }

                // Build and send stats message using the handler's buildStatsMessage function
                // For SkyBlock handlers, we pass the SkyBlock member data as the stats parameter
                const statsMessageResult = gameHandler.buildStatsMessage(
                    target,
                    null,
                    skyblockData.memberData,
                    api
                );
                const statsMessage = await Promise.resolve(statsMessageResult); // Handle both sync and async

                if (this.config.debugMode) {
                    api.log.info(
                        `[SkyBlock Debug] Stats message generated: ${statsMessage.substring(0, 100)}...`
                    );
                }
                api.chat.sendGuildChat(statsMessage);

                api.log.success(`Sent ${gameHandler.gameMode} stats for ${target}`);
            } catch (error) {
                api.log.error(`Error fetching ${gameHandler.gameMode} stats:`, error);
                const errorMessage = `${requester}, An error occurred while fetching ${gameHandler.gameMode} stats for ${target}. Please try again later. | ${getRandomHexColor()}`;
                api.chat.sendGuildChat(errorMessage);
            } finally {
                // Always cleanup the processing flag
                this.processingRequests.delete(requestKey);
            }
        };
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
                `Cleaned up old cooldowns, ${this.cooldowns.size} active cooldowns remaining`
            );
        }
    }

    /**
     * Start cache cleanup interval
     */
    private startCacheCleanup(): void {
        this.cacheCleanupInterval = setInterval(() => {
            this.cleanupExpiredCache();
        }, this.config.cacheCleanupInterval);
    }

    /**
     * Clean up expired cache entries
     */
    private cleanupExpiredCache(): void {
        const now = Date.now();
        let removedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now >= entry.expiresAt) {
                this.cache.delete(key);
                removedCount++;
            }
        }

        if (this.config.debugMode && this.api) {
            this.api.log.debug(
                `Cleaned up ${removedCount} expired cache entries, ${this.cache.size} active cache entries remaining`
            );
        }
    }

    /**
     * Get data from cache if not expired
     */
    private getCachedData(key: string): any | null {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }

        const now = Date.now();
        if (now >= entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        if (this.config.debugMode && this.api) {
            this.api.log.debug(`Cache hit for key: ${key}`);
        }

        return entry.data;
    }

    /**
     * Store data in cache
     */
    private setCachedData(key: string, data: any): void {
        const now = Date.now();
        const entry: CacheEntry = {
            data: data,
            timestamp: now,
            expiresAt: now + this.config.cacheExpiryTime,
        };

        this.cache.set(key, entry);

        if (this.config.debugMode && this.api) {
            this.api.log.debug(
                `Cached data for key: ${key}, expires in ${this.config.cacheExpiryTime / 1000}s`
            );
        }
    }

    /**
     * Generate cache key for API requests
     */
    private generateCacheKey(
        type: 'player' | 'skyblock' | 'mojang',
        identifier: string,
        extra?: string
    ): string {
        const baseKey = `${type}:${identifier.toLowerCase()}`;
        return extra ? `${baseKey}:${extra}` : baseKey;
    }

    /**
     * Handle fetch errors
     */
    private handleFetchError(
        error: any,
        requester: string,
        target: string,
        api: ExtensionAPI
    ): void {
        let message: string;

        if (error.status === 404) {
            message = `${requester}, Player "${target}" not found. Please check the spelling. | ${getRandomHexColor()}`;
        } else if (error.status === 429) {
            message = `${requester}, Rate limited. Please try again later. | ${getRandomHexColor()}`;
        } else if (error.status >= 500) {
            message = `${requester}, Server error. Please try again later. | ${getRandomHexColor()}`;
        } else {
            message = `${requester}, Unable to fetch stats for "${target}". Please try again. | ${getRandomHexColor()}`;
        }

        api.chat.sendGuildChat(message);
        api.log.warn(`Fetch error for ${target}: ${error.status} - ${error.statusText}`);
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

        // Clear cache cleanup interval
        if (this.cacheCleanupInterval) {
            clearInterval(this.cacheCleanupInterval);
            this.cacheCleanupInterval = null;
        }

        // Clear all cooldowns, cache, and processing requests
        this.cooldowns.clear();
        this.cache.clear();
        this.processingRequests.clear();
        this.api?.log.info('Hypixel Stats Extension v2.0 destroyed');
    }
}

module.exports = HypixelStatsExtension;
