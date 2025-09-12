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
 * @author MiscGuild Bridge Bot Team  
 * @version 2.0.0
 */

import { ChatMessageContext, ExtensionAPI, ChatPattern, HypixelPlayerResponse } from './types';
import { allHandlers } from './handlers';
import { getRandomHexColor, fetchMojangProfile, fetchHypixelPlayerProfile, isFetchError } from './utils';

class HypixelStatsExtension {
    manifest = {
        id: 'hypixel-stats',
        name: 'Hypixel Stats Checker v2.0',
        version: '2.0.0',
        description: 'Comprehensive multi-game Hypixel stats checking with modular handlers',
        author: 'MiscGuild Bridge Bot Team'
    };

    private config: any = {};
    private botContext: any;
    private api: ExtensionAPI | null = null;
    
    // Cooldown tracking
    private cooldowns: Map<string, number> = new Map();
    private processingRequests: Set<string> = new Set(); // Track ongoing requests
    private cleanupInterval: NodeJS.Timeout | null = null;

    // Default configuration
    private defaultConfig = {
        enabled: true,
        hypixelApiKey: process.env.HYPIXEL_API_KEY || '',
        debugMode: false,
        // Cooldown system now handled by isOnCooldown method based on guild rank
        cleanupInterval: 5 * 60 * 1000 // Clean up old cooldowns every 5 minutes
    };

    /**
     * Initialize the extension
     */
    async init(context: any, api: ExtensionAPI): Promise<void> {
        this.config = { ...this.defaultConfig, ...api.config };
        this.botContext = context;
        this.api = api;
        
        api.log.info('🎮 Initializing Hypixel Stats Extension v2.0...');
        
        if (!this.config.enabled) {
            api.log.warn('Hypixel Stats Extension is disabled in config');
            return;
        }

        if (!this.config.hypixelApiKey) {
            api.log.error('❌ Hypixel API key not found! Please set HYPIXEL_API_KEY environment variable');
            return;
        }

        api.log.info(`📊 Loaded ${allHandlers.length} game mode handlers: ${allHandlers.map(h => h.gameMode).join(', ')}`);
        
        // Start cooldown cleanup interval
        this.startCooldownCleanup();
        
        api.log.success('✅ Hypixel Stats Extension v2.0 initialized successfully');
    }

    /**
     * Generate chat patterns for all supported game modes
     */
    getChatPatterns(): ChatPattern[] {
        const patterns: ChatPattern[] = [];

        // Create a pattern for each game mode handler
        allHandlers.forEach((handler, index) => {
            patterns.push({
                id: `${handler.gameMode.toLowerCase()}-stats`,
                extensionId: 'hypixel-stats',
                pattern: new RegExp(`^!${handler.command}(?:\\s+(.+))?$`, 'i'),
                priority: 1,
                description: handler.description,
                handler: this.createStatsHandler(handler).bind(this)
            });
        });

        return patterns;
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
                const message = `/gc ${requester}, you can only use this command again in ${cooldownRemaining} seconds. Please wait. | ${getRandomHexColor()}`;
                api.chat.sendGuildChat(message);
                return;
            }

            // Mark request as processing and set cooldown
            this.processingRequests.add(requestKey);
            this.setCooldown(requester, Date.now());

            api.log.info(`🔍 Looking up ${gameHandler.gameMode} stats for ${target} (requested by ${requester})`);

            try {
                // Fetch Mojang profile
                const mojangProfile = await fetchMojangProfile(target);
                if (isFetchError(mojangProfile)) {
                    this.handleFetchError(mojangProfile, requester, target, api);
                    this.processingRequests.delete(requestKey);
                    return;
                }

                // Fetch Hypixel player data
                const playerData = await fetchHypixelPlayerProfile(mojangProfile.id, this.config.hypixelApiKey);
                if (isFetchError(playerData)) {
                    this.handleFetchError(playerData, requester, target, api);
                    this.processingRequests.delete(requestKey);
                    return;
                }

                // Get game stats based on the handler's game mode
                const gameStats = playerData.stats?.[gameHandler.gameMode];
                
                // Build and send stats message using the handler's buildStatsMessage function
                const statsMessage = gameHandler.buildStatsMessage(target, playerData.achievements, gameStats);
                api.chat.sendGuildChat(statsMessage);

                api.log.success(`✅ Sent ${gameHandler.gameMode} stats for ${target}`);

            } catch (error) {
                api.log.error(`Error fetching ${gameHandler.gameMode} stats:`, error);
                const errorMessage = `/gc ${requester}, An error occurred while fetching ${gameHandler.gameMode} stats for ${target}. Please try again later. | ${getRandomHexColor()}`;
                api.chat.sendGuildChat(errorMessage);
            } finally {
                // Always cleanup the processing flag
                this.processingRequests.delete(requestKey);
            }
        };
    }

    /**
     * Check if user is on cooldown
     */
    private isOnCooldown(
        playerName: string,
        guildRank: string | undefined,
        now: number
    ): number | null {
        let cooldownTime: number | undefined;

        if (guildRank?.includes('Member')) {
            cooldownTime = 1 * 60 * 1000; // 1 minute for members
        }

        if (cooldownTime) {
            const lastRun = this.cooldowns.get(playerName);
            if (lastRun && now - lastRun < cooldownTime) {
                return Math.ceil((cooldownTime - (now - lastRun)) / 1000);
            }
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
            this.api.log.debug(`🧹 Cleaned up old cooldowns, ${this.cooldowns.size} active cooldowns remaining`);
        }
    }

    /**
     * Handle fetch errors
     */
    private handleFetchError(error: any, requester: string, target: string, api: ExtensionAPI): void {
        let message: string;

        if (error.status === 404) {
            message = `/gc ${requester}, Player "${target}" not found. Please check the spelling. | ${getRandomHexColor()}`;
        } else if (error.status === 429) {
            message = `/gc ${requester}, Rate limited. Please try again later. | ${getRandomHexColor()}`;
        } else if (error.status >= 500) {
            message = `/gc ${requester}, Server error. Please try again later. | ${getRandomHexColor()}`;
        } else {
            message = `/gc ${requester}, Unable to fetch stats for "${target}". Please try again. | ${getRandomHexColor()}`;
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
        
        // Clear all cooldowns and processing requests
        this.cooldowns.clear();
        this.processingRequests.clear();
        this.api?.log.info('🛑 Hypixel Stats Extension v2.0 destroyed');
    }
}

module.exports = HypixelStatsExtension;
