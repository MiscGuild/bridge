/**
 * Urchin Blacklist Extension v1.0
 *
 * Provides blacklist checking functionality using the Urchin API.
 *
 * Commands:
 * - !view [username] - Check if a player has blacklist tags
 *
 * @author MiscGuild Bridge Bot Team
 * @version 1.0.0
 */

import { ChatMessageContext, ExtensionAPI, ChatPattern } from './types';

class UrchinBlacklistExtension {
    manifest = {
        id: 'urchin-blacklist',
        name: 'Urchin Blacklist Checker v1.0',
        version: '1.0.0',
        description: 'Check player blacklist status using Urchin API',
        author: 'MiscGuild Bridge Bot Team',
    };

    private config: any = {};
    private botContext: any;
    private api: ExtensionAPI | null = null;

    // Cooldown tracking
    private cooldowns: Map<string, number> = new Map();
    private processingRequests: Set<string> = new Set();
    private cleanupInterval: NodeJS.Timeout | null = null;

    // Default configuration
    private defaultConfig = {
        enabled: true,
        urchinApiKey: process.env.URCHIN_API_KEY || '',
        debugMode: false,
        cooldownTime: parseInt(process.env.COOLDOWN_URCHIN || '5') * 1000, // Convert seconds to milliseconds
        cleanupInterval: 5 * 60 * 1000, // Clean up old cooldowns every 5 minutes
    };

    /**
     * Initialize the extension
     */
    async init(context: any, api: ExtensionAPI): Promise<void> {
        this.config = { ...this.defaultConfig, ...api.config };
        this.botContext = context;
        this.api = api;

        api.log.info('Initializing Urchin Blacklist Extension...');

        if (!this.config.enabled) {
            api.log.warn('Urchin Blacklist Extension is disabled in config');
            return;
        }

        if (!this.config.urchinApiKey) {
            api.log.error(
                'Urchin API key not found! Please set URCHIN_API_KEY environment variable'
            );
            return;
        }

        // Start cooldown cleanup interval
        this.startCooldownCleanup();

        api.log.success('Urchin Blacklist Extension initialized successfully');
    }

    /**
     * Generate chat patterns for all commands
     */
    getChatPatterns(): ChatPattern[] {
        const patterns: ChatPattern[] = [];

        // Add !view command
        patterns.push({
            id: 'urchin-view',
            extensionId: 'urchin-blacklist',
            pattern: /^!view(?:\s+(.+))?$/i,
            priority: 1,
            description: 'Check player blacklist status',
            handler: this.handleViewCommand.bind(this),
        });

        return patterns;
    }

    /**
     * Send message to correct channel based on context
     */
    private sendToChannel(context: ChatMessageContext, api: ExtensionAPI, message: string): void {
        if (context.channel === 'Officer') {
            api.chat.sendOfficerChat(message);
        } else if (context.channel === 'Guild') {
            api.chat.sendGuildChat(message);
        } else if (context.channel === 'Private') {
            api.chat.sendPrivateMessage(context.username, message);
        } else {
            // Default to guild chat for unknown channels
            api.chat.sendGuildChat(message);
        }
    }

    /**
     * Handle !view command
     */
    private async handleViewCommand(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        if (!this.config.enabled) return;

        const requester = context.username;
        const target = context.matches?.[1]?.trim() || requester;
        const requestKey = `${requester}-${target}-view`;

        // Prevent multiple simultaneous requests
        if (this.processingRequests.has(requestKey)) {
            api.log.debug(`⏳ Ignoring duplicate request: ${requestKey}`);
            return;
        }

        // Check cooldown
        const cooldownRemaining = this.isOnCooldown(requester, Date.now());
        if (cooldownRemaining > 0) {
            const message = `${requester}, you can use !view again in ${cooldownRemaining} seconds. | #${Math.floor(
                Math.random() * 0xffffff
            )
                .toString(16)
                .padStart(6, '0')}`;
            this.sendToChannel(context, api, message);
            return;
        }

        // Mark request as processing and set cooldown
        this.processingRequests.add(requestKey);
        this.setCooldown(requester, Date.now());

        api.log.info(`Looking up blacklist info for ${target} (requested by ${requester})`);

        try {
            // Step 1: Convert username to UUID using Mojang API
            let uuid: string;
            try {
                const uuidResponse = await fetch(
                    `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(target)}`,
                    {
                        headers: {
                            'User-Agent': 'MiscellaneousBridge/2.6 (info@vliegenier04.dev)',
                            Accept: 'application/json',
                        },
                    }
                );

                if (uuidResponse.status === 204 || uuidResponse.status === 404) {
                    this.sendToChannel(
                        context,
                        api,
                        `[NOT-TAGGED] ${target} is not a valid Minecraft username. | #${this.getRandomHexColor()}`
                    );
                    return;
                }

                if (!uuidResponse.ok) {
                    throw new Error(`Mojang API error: ${uuidResponse.status}`);
                }

                const uuidData: any = await uuidResponse.json();
                uuid = uuidData.id; // UUID without hyphens
            } catch (error) {
                api.log.error(`Error fetching UUID for ${target}:`, error);
                this.sendToChannel(
                    context,
                    api,
                    `[ERROR] Failed to lookup ${target}. Please try again later. | #${this.getRandomHexColor()}`
                );
                return;
            }

            // Step 2: Query Urchin API for blacklist tags
            const urchinUrl = `https://urchin.ws/player/${uuid}?key=${this.config.urchinApiKey}&sources=GAME,MANUAL,CHAT,ME,PARTY`;

            try {
                const urchinResponse = await fetch(urchinUrl, {
                    headers: {
                        'User-Agent': 'MiscellaneousBridge/2.6 (info@vliegenier04.dev)',
                        Accept: 'application/json',
                    },
                });

                if (urchinResponse.status === 404) {
                    this.sendToChannel(
                        context,
                        api,
                        `[NOT-TAGGED] ${target} has no tags in the blacklist. | #${this.getRandomHexColor()}`
                    );
                    return;
                }

                if (urchinResponse.status === 401) {
                    api.log.error('Invalid Urchin API key');
                    this.sendToChannel(
                        context,
                        api,
                        `[ERROR] API authentication failed. Please contact an administrator. | #${this.getRandomHexColor()}`
                    );
                    return;
                }

                if (urchinResponse.status === 429) {
                    this.sendToChannel(
                        context,
                        api,
                        `[ERROR] Rate limit exceeded. Please try again later. | #${this.getRandomHexColor()}`
                    );
                    return;
                }

                if (!urchinResponse.ok) {
                    throw new Error(`Urchin API error: ${urchinResponse.status}`);
                }

                const urchinData: any = await urchinResponse.json();

                // Step 3: Process and display tags
                if (!urchinData || !urchinData.tags || urchinData.tags.length === 0) {
                    this.sendToChannel(
                        context,
                        api,
                        `[NOT-TAGGED] ${target} has no tags in the blacklist. | #${this.getRandomHexColor()}`
                    );
                    return;
                }

                // Display each tag
                for (const tag of urchinData.tags) {
                    const tagType = (tag.type || 'UNKNOWN').toUpperCase().replace(/ /g, '-');
                    const reason = tag.reason || 'No reason given';
                    this.sendToChannel(
                        context,
                        api,
                        `[${tagType}] ${target} - ${reason} | #${this.getRandomHexColor()}`
                    );
                }

                api.log.success(
                    `Sent blacklist info for ${target} (${urchinData.tags.length} tags found)`
                );
            } catch (error) {
                api.log.error(`Error querying Urchin API for ${target}:`, error);
                this.sendToChannel(
                    context,
                    api,
                    `[ERROR] Failed to check blacklist for ${target}. Please try again later. | #${this.getRandomHexColor()}`
                );
            }
        } catch (error) {
            api.log.error(`Unexpected error in !view command:`, error);
            this.sendToChannel(
                context,
                api,
                `[ERROR] An unexpected error occurred. Please try again later. | #${this.getRandomHexColor()}`
            );
        } finally {
            // Always cleanup the processing flag
            this.processingRequests.delete(requestKey);
        }
    }

    /**
     * Check if user is on cooldown
     */
    private isOnCooldown(playerName: string, now: number): number {
        const lastRequest = this.cooldowns.get(playerName);
        if (lastRequest) {
            const timeDiff = now - lastRequest;
            if (timeDiff < this.config.cooldownTime) {
                return Math.ceil((this.config.cooldownTime - timeDiff) / 1000);
            }
        }
        return 0;
    }

    /**
     * Set cooldown for user
     */
    private setCooldown(playerName: string, timestamp: number): void {
        this.cooldowns.set(playerName, timestamp);
    }

    /**
     * Start cleanup interval for old cooldowns
     */
    private startCooldownCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [playerName, timestamp] of this.cooldowns.entries()) {
                if (now - timestamp > this.config.cooldownTime * 2) {
                    this.cooldowns.delete(playerName);
                }
            }
        }, this.config.cleanupInterval);
    }

    /**
     * Generate random hex color
     */
    private getRandomHexColor(): string {
        return Math.floor(Math.random() * 0xffffff)
            .toString(16)
            .padStart(6, '0');
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.cooldowns.clear();
        this.processingRequests.clear();

        if (this.api) {
            this.api.log.info('Urchin Blacklist Extension cleaned up');
        }
    }
}

module.exports = UrchinBlacklistExtension;
