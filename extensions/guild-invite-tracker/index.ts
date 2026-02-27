/**
 * Guild Invite Tracker Extension v3.4 - Complete Guild Activity Monitoring
 *
 * HYBRID APPROACH: Uses chat patterns with member-specific guild log queries
 * - Runs /g log [username] for specific member logs
 * - Only checks first 2 log entries to avoid false positives
 * - Sends Discord notifications for joins (invited/non-invited), leaves, and kicks
 * - Includes deduplication to prevent double messages
 *
 * @author MiscGuild Bridge Bot Team
 * @version 3.4.0
 */

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
    extensionId: 'guild-invite-tracker';
    pattern: RegExp;
    priority: number;
    description?: string;
    passthrough?: boolean;
    handler: (context: ChatMessageContext, api: ExtensionAPI) => Promise<void> | void;
}

export default class GuildInviteTracker {
    manifest = {
        id: 'guild-invite-tracker',
        name: 'Guild Activity Tracker v3.4',
        version: '3.4.0',
        description:
            'Complete guild activity monitoring: joins, leaves, kicks, and invite tracking',
        author: 'MiscGuild Bridge Bot Team',
    };

    private config: any = {};
    private botContext: any;
    private api: ExtensionAPI | null = null;
    private processingJoin: string | null = null;
    private processedUsers: Set<string> = new Set(); // Track recently processed users
    private processedLogs: Set<string> = new Set(); // Track processed guild logs

    // Enhanced configuration
    private defaultConfig = {
        enabled: true,
        logDelay: 1000,
        discordChannel: 'oc',
        debugMode: true,
    };

    /**
     * Initialize the extension
     */
    async init(context: any, api: ExtensionAPI): Promise<void> {
        this.config = { ...this.defaultConfig, ...api.config };
        this.botContext = context;
        this.api = api;

        api.log.info('Initializing Guild Activity Tracker v3.4 (Complete Monitoring)...');

        if (!this.config.enabled) {
            api.log.warn('Guild Activity Tracker is disabled in config');
            return;
        }

        api.log.success('Guild Activity Tracker v3.4 initialized successfully');
    }

    /**
     * Enhanced chat patterns with multiple detection methods
     */
    getChatPatterns(): ChatPattern[] {
        return [
            // Pattern 1: Direct guild join message detection (supports optional ranks)
            {
                id: 'guild-join-direct',
                extensionId: 'guild-invite-tracker',
                pattern: /^\[.+\]\s+(?:\[[^\]]+\]\s+)?(.+?)\s+joined the guild!$/,
                priority: 0,
                description: 'Detects direct guild join messages with optional rank support',
                handler: this.handleDirectGuildJoin.bind(this),
            },
            // Pattern 2: Guild leave message detection (supports optional ranks)
            {
                id: 'guild-leave-direct',
                extensionId: 'guild-invite-tracker',
                pattern: /^\[.+\]\s+(?:\[[^\]]+\]\s+)?(.+?)\s+left the guild!$/,
                priority: 0,
                description: 'Detects direct guild leave messages with optional rank support',
                handler: this.handleDirectGuildLeave.bind(this),
            },
            // Pattern 3: Guild kick message detection (supports optional ranks)
            {
                id: 'guild-kick-direct',
                extensionId: 'guild-invite-tracker',
                pattern:
                    /^\[.+\]\s+(?:\[[^\]]+\]\s+)?(.+?)\s+was kicked from the guild by\s+(?:\[[^\]]+\]\s+)?(.+?)!$/,
                priority: 0,
                description: 'Detects guild kick messages with optional rank support',
                handler: this.handleDirectGuildKick.bind(this),
            },
            // Pattern 4: Guild log response detection
            {
                id: 'guild-log-response',
                extensionId: 'guild-invite-tracker',
                pattern: /Guild Log \(Page \d+ of \d+\)/,
                priority: 1,
                description: 'Detects guild log responses',
                handler: this.handleGuildLogResponse.bind(this),
            },
        ];
    }

    /**
     * Handle direct guild join messages
     */
    private async handleDirectGuildJoin(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!this.config.enabled) return;

        const matches = context.matches;
        if (!matches) return;

        const username = matches[1].trim();

        // Check if we've already processed this user recently (prevent duplicates)
        if (this.processedUsers.has(username)) {
            api.log.debug(`Skipping duplicate guild join for: ${username}`);
            return;
        }

        api.log.info(`Guild join detected: ${username}`);

        // Add to processed users and set a timeout to remove after 30 seconds
        this.processedUsers.add(username);
        setTimeout(() => {
            this.processedUsers.delete(username);
        }, 30000);

        // Store the username we're processing
        this.processingJoin = username;

        // Check guild member count
        await this.checkGuildCapacity(api);

        // Execute guild log command for specific member
        setTimeout(() => {
            if (this.botContext?.bot) {
                api.log.info(`Executing guild log for ${username}`);
                this.botContext.bot.chat(`/g log ${username}`);
            }
        }, this.config.logDelay);
    }

    /**
     * Handle direct guild leave messages
     */
    private async handleDirectGuildLeave(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!this.config.enabled) return;

        const matches = context.matches;
        if (!matches) return;

        const username = matches[1].trim();

        // Check if we've already processed this user recently (prevent duplicates)
        if (this.processedUsers.has(username)) {
            api.log.debug(`Skipping duplicate guild leave for: ${username}`);
            return;
        }

        api.log.info(`Guild leave detected: ${username}`);

        // Add to processed users and set a timeout to remove after 30 seconds
        this.processedUsers.add(username);
        setTimeout(() => {
            this.processedUsers.delete(username);
        }, 30000);

        // Send immediate Discord notification for leave
        await this.sendLeaveNotification(username, api);
    }

    /**
     * Handle direct guild kick messages
     */
    private async handleDirectGuildKick(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!this.config.enabled) return;

        const matches = context.matches;
        if (!matches) return;

        const kickedUser = matches[1].trim();
        const kickerUser = matches[2].trim();

        // Check if we've already processed this kick recently (prevent duplicates)
        const kickKey = `${kickedUser}-kicked-by-${kickerUser}`;
        if (this.processedUsers.has(kickKey)) {
            api.log.debug(`Skipping duplicate guild kick for: ${kickedUser}`);
            return;
        }

        api.log.info(`Guild kick detected: ${kickedUser} kicked by ${kickerUser}`);

        // Add to processed users and set a timeout to remove after 30 seconds
        this.processedUsers.add(kickKey);
        setTimeout(() => {
            this.processedUsers.delete(kickKey);
        }, 30000);

        // Send immediate Discord notification for kick
        await this.sendKickNotification(kickedUser, kickerUser, api);
    }

    /**
     * Handle guild log responses
     */
    private async handleGuildLogResponse(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!this.config.enabled || !this.processingJoin) return;

        const username = this.processingJoin;
        const logData = context.raw;

        // Check if we've already processed a log for this user
        if (this.processedLogs.has(username)) {
            api.log.debug(`Skipping duplicate guild log processing for: ${username}`);
            return;
        }

        api.log.info(`Processing guild log for ${username}`);

        // Mark this user as having their log processed
        this.processedLogs.add(username);

        try {
            const inviteInfo = this.parseGuildLogForInvite(logData, username, api);

            if (inviteInfo) {
                await this.sendInviteNotification(username, inviteInfo.inviter, api);
            } else {
                await this.sendNoInviteNotification(username, api);
            }
        } catch (error) {
            api.log.error('Error processing guild log:', error);
        } finally {
            // Clear processing state
            this.processingJoin = null;

            // Remove from processed logs after a short delay to allow for cleanup
            setTimeout(() => {
                this.processedLogs.delete(username);
            }, 5000);
        }
    }

    /**
     * Enhanced guild log parser - only checks first two entries
     */
    private parseGuildLogForInvite(
        logData: string,
        targetUsername: string,
        api: ExtensionAPI
    ): { inviter: string } | null {
        try {
            const lines = logData.split('\n');

            // Filter out empty lines and header/footer
            const logEntries = lines.filter((line) => {
                const trimmed = line.trim();
                return (
                    trimmed &&
                    !trimmed.includes('Guild Log') &&
                    !trimmed.includes('Page') &&
                    !trimmed.includes('---') &&
                    !trimmed.startsWith('[') && // Remove navigation lines
                    trimmed.length > 10
                ); // Filter out very short lines
            });

            // Only check the first 2 entries to avoid false positives
            const firstTwoEntries = logEntries.slice(0, 2);

            if (this.config.debugMode) {
                api.log.debug(`Checking first 2 log entries for ${targetUsername}:`);
                firstTwoEntries.forEach((entry, index) => {
                    api.log.debug(`  Entry ${index + 1}: ${entry.trim()}`);
                });
            }

            // Look for invite relationship in first two entries
            for (let i = 0; i < firstTwoEntries.length; i++) {
                const entry = firstTwoEntries[i].trim();

                // Check if this entry mentions the target user being invited
                if (entry.includes(targetUsername) && entry.includes('invited')) {
                    // Enhanced regex patterns to extract inviter name
                    const patterns = [
                        new RegExp(`(\\w+)\\s+invited\\s+${targetUsername}`), // "Richy135 invited Vliegnier04"
                        new RegExp(`(\\w+)\\s+invited\\s+${targetUsername}\\s*$`), // With optional end
                        /(\w+)\s+invited\s+\w+$/, // Standard format fallback
                        /EDT:\s*(\w+)\s+invited/, // With timezone
                        /EST:\s*(\w+)\s+invited/, // EST timezone
                        /\d{2}:\d{2}\s+[A-Z]{3}:\s*(\w+)\s+invited/, // Full timestamp format
                    ];

                    for (const pattern of patterns) {
                        const match = entry.match(pattern);
                        if (match) {
                            const inviter = match[1];
                            api.log.success(
                                `Found inviter in entry ${i + 1}: ${inviter} invited ${targetUsername}`
                            );
                            return { inviter };
                        }
                    }
                }
            }

            // If no invite found in first two entries, the user likely joined without an invite
            api.log.info(
                `ℹ️  No invite found in first 2 entries for ${targetUsername} - likely joined without invite`
            );
            return null;
        } catch (error) {
            api.log.error('Error parsing guild log:', error);
            return null;
        }
    }

    /**
     * Send Discord notification
     */
    private async sendInviteNotification(
        username: string,
        inviterName: string,
        api: ExtensionAPI
    ): Promise<void> {
        try {
            const message = `Player **${username}** joined the guild! They were invited by **${inviterName}**.`;

            const bridge = this.botContext?.bridge;
            if (bridge?.discord?.send) {
                await bridge.discord.send(this.config.discordChannel, message);
                api.log.success(`Sent invite notification: ${username} invited by ${inviterName}`);
            } else {
                api.log.error('Discord bridge not available');
            }
        } catch (error) {
            api.log.error('Error sending Discord notification:', error);
        }
    }

    /**
     * Send Discord notification for member who joined without invite
     */
    private async sendNoInviteNotification(username: string, api: ExtensionAPI): Promise<void> {
        try {
            const message = `Player **${username}** joined the guild without an invite.`;

            const bridge = this.botContext?.bridge;
            if (bridge?.discord?.send) {
                await bridge.discord.send(this.config.discordChannel, message);
                api.log.success(`Sent no-invite notification: ${username} joined without invite`);
            } else {
                api.log.error('Discord bridge not available');
            }
        } catch (error) {
            api.log.error('Error sending Discord notification:', error);
        }
    }

    /**
     * Send Discord notification for member who left the guild
     */
    private async sendLeaveNotification(username: string, api: ExtensionAPI): Promise<void> {
        try {
            const message = `Player **${username}** left the guild.`;

            const bridge = this.botContext?.bridge;
            if (bridge?.discord?.send) {
                await bridge.discord.send(this.config.discordChannel, message);
                api.log.success(`Sent leave notification: ${username} left the guild`);
            } else {
                api.log.error('Discord bridge not available');
            }
        } catch (error) {
            api.log.error('Error sending Discord notification:', error);
        }
    }

    /**
     * Send Discord notification for member who was kicked from the guild
     */
    private async sendKickNotification(
        kickedUser: string,
        kickerUser: string,
        api: ExtensionAPI
    ): Promise<void> {
        try {
            const message = `Player **${kickedUser}** was kicked from the guild by **${kickerUser}**.`;

            const bridge = this.botContext?.bridge;
            if (bridge?.discord?.send) {
                await bridge.discord.send(this.config.discordChannel, message);
                api.log.success(`Sent kick notification: ${kickedUser} kicked by ${kickerUser}`);
            } else {
                api.log.error('Discord bridge not available');
            }
        } catch (error) {
            api.log.error('Error sending Discord notification:', error);
        }
    }

    /**
     * Check guild capacity and send notification if full
     */
    private async checkGuildCapacity(api: ExtensionAPI): Promise<void> {
        try {
            const hypixelApiKey = process.env.HYPIXEL_API_KEY;
            if (!hypixelApiKey) {
                api.log.warn('Hypixel API key not found, cannot check guild capacity');
                return;
            }

            // Get bot's UUID first
            const botUsername = this.botContext?.bot?.username;
            if (!botUsername) return;

            const mojangResponse = await fetch(
                `https://api.mojang.com/users/profiles/minecraft/${botUsername}`
            );
            if (!mojangResponse.ok) return;

            const mojangData: any = await mojangResponse.json();
            const botUuid = mojangData.id;

            // Fetch guild data using bot's UUID
            const guildResponse = await fetch(
                `https://api.hypixel.net/guild?player=${botUuid}&key=${hypixelApiKey}`
            );
            if (!guildResponse.ok) {
                api.log.error(`Failed to fetch guild data: ${guildResponse.status}`);
                return;
            }

            const guildData: any = await guildResponse.json();

            if (!guildData.success || !guildData.guild) {
                api.log.error('Invalid guild data received');
                return;
            }

            const memberCount = guildData.guild.members?.length || 0;
            const maxMembers = 125; // Hypixel guild max capacity

            api.log.info(`Guild capacity: ${memberCount}/${maxMembers}`);

            // If guild is full or very close, send notification
            if (memberCount >= maxMembers) {
                const message = `**GUILD IS FULL!** Current members: ${memberCount}/${maxMembers}. Cannot accept new members.`;
                const bridge = this.botContext?.bridge;
                if (bridge?.discord?.send) {
                    await bridge.discord.send(this.config.discordChannel, message);
                    api.log.warn(`Guild is full: ${memberCount}/${maxMembers}`);
                }
            } else if (memberCount >= maxMembers - 5) {
                // Warn when approaching capacity
                const message = `Guild approaching capacity: ${memberCount}/${maxMembers} members`;
                const bridge = this.botContext?.bridge;
                if (bridge?.discord?.send) {
                    await bridge.discord.send(this.config.discordChannel, message);
                    api.log.warn(`Guild approaching capacity: ${memberCount}/${maxMembers}`);
                }
            }
        } catch (error) {
            api.log.error('Error checking guild capacity:', error);
        }
    }

    /**
     * Cleanup
     */
    async destroy(): Promise<void> {
        this.processingJoin = null;
        this.processedUsers.clear();
        this.processedLogs.clear();
        this.api?.log.info('Guild Activity Tracker v3.4 destroyed');
    }
}
