/**
 * Staff Management Extension
 *
 * Provides administrative tools and analytics for guild staff members.
 *
 * Features:
 * - Guild statistics logging (messages, joins, leaves, etc.)
 * - Daily automated reports to officer channel
 * - Analytics commands (!analytics weekly/monthly/today)
 * - Manual stats report (!statsreport)
 * - Administrative controls (!reboot, !save)
 * - Ban system (!gban, !bridgeban, !cmdban, !unban, !banlist)
 * - Permission-based access control
 *
 * Permissions:
 * - Analytics: Mod, Leader, GM
 * - Reboot: Leader, GM only
 * - Bans: Leader, GM, Officer
 *
 * @author MiscGuild Bridge Bot Team
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';

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
        executeCommand: (command: string) => void;
    };
    discord: {
        send: (channelId: string, content: any, color?: number, ping?: boolean) => Promise<any>;
        sendMessage: (channelId: string, content: any) => Promise<any>;
        sendEmbed: (channelId: string, embed: any) => Promise<any>;
        channels: {
            blacklist: string;
            officer: string;
            member: string;
            error: string;
            command: string;
        };
    };
    utils: Record<string, any>;
}

interface ChatPattern {
    id: string;
    extensionId: string;
    pattern: RegExp;
    priority: number;
    description?: string;
    passthrough?: boolean;
    handler: (context: ChatMessageContext, api: ExtensionAPI) => Promise<void> | void;
}

interface DailyStats {
    date: string;
    messagesReceived: number;
    commandsUsed: number;
    membersJoined: number;
    membersLeft: number;
    membersKicked: number;
    promotions: number;
    demotions: number;
    guildLevelUps: number;
    questsCompleted: number;
    activeUsers: Set<string>;
    topChatters: Record<string, number>;
}

interface AnalyticsData {
    dailyStats: Record<string, DailyStats>;
    lastReportDate: string;
    totalStats: {
        totalMessages: number;
        totalCommands: number;
        totalJoins: number;
        totalLeaves: number;
        totalKicks: number;
        totalPromotions: number;
        totalDemotions: number;
        totalLevelUps: number;
        totalQuests: number;
    };
}

interface BanEntry {
    name: string;
    uuid: string;
    endDate: string; // Format: DD/MM/YYYY or "Never"
    reason: string;
    messageId?: string; // Discord message ID for guild bans
    bannedBy: string;
    bannedAt: string;
    type: 'guild' | 'bridge' | 'command';
}

interface BanList {
    bans: BanEntry[];
}

class StaffManagementExtension {
    readonly manifest = {
        id: 'staff-management',
        name: 'Staff Management',
        version: '1.0.0',
        description: 'Analytics logging and administrative controls for guild staff',
        author: 'MiscGuild Bridge Bot Team',
    };

    private config: any = {};
    private analyticsData: AnalyticsData = {
        dailyStats: {},
        lastReportDate: '',
        totalStats: {
            totalMessages: 0,
            totalCommands: 0,
            totalJoins: 0,
            totalLeaves: 0,
            totalKicks: 0,
            totalPromotions: 0,
            totalDemotions: 0,
            totalLevelUps: 0,
            totalQuests: 0,
        },
    };

    private banList: BanList = {
        bans: [],
    };

    private dataFilePath: string = '';
    private banListPath: string = '';
    private reportInterval: NodeJS.Timeout | null = null;
    private saveInterval: NodeJS.Timeout | null = null;
    private banCheckInterval: NodeJS.Timeout | null = null;
    private api: ExtensionAPI | null = null;

    // Default configuration
    private defaultConfig = {
        enabled: true,
        dataFile: 'guild-analytics.json',
        banFile: 'staff-bans.json',
        dailyReports: true,
        reportChannel: 'oc', // Officer channel
        debugMode: false,
    };

    // Build staff ranks from environment variables
    private get analyticsRanks(): string[] {
        // Ranks that can access analytics: RANK_4 (Mod), RANK_5 (Leader), RANK_LEADER (GM)
        const ranks: string[] = [];
        if (process.env.RANK_4) ranks.push(`[${process.env.RANK_4}]`);
        if (process.env.RANK_5) ranks.push(`[${process.env.RANK_5}]`);
        if (process.env.RANK_LEADER) ranks.push(`[${process.env.RANK_LEADER}]`);
        return ranks;
    }

    private get adminRanks(): string[] {
        // Admin ranks that can use reboot: RANK_5 (Leader), RANK_LEADER (GM)
        const ranks: string[] = [];
        if (process.env.RANK_5) ranks.push(`[${process.env.RANK_5}]`);
        if (process.env.RANK_LEADER) ranks.push(`[${process.env.RANK_LEADER}]`);
        return ranks;
    }

    private get banRanks(): string[] {
        // Staff ranks that can use ban commands (configurable via BAN_ALLOWED_RANKS env var)
        if (process.env.BAN_ALLOWED_RANKS) {
            return process.env.BAN_ALLOWED_RANKS.split(',').map((r) => r.trim());
        }
        // Default to RANK_4 (Mod), RANK_5 (Leader), RANK_LEADER (GM)
        const ranks: string[] = [];
        if (process.env.RANK_4) ranks.push(`[${process.env.RANK_4}]`);
        if (process.env.RANK_5) ranks.push(`[${process.env.RANK_5}]`);
        if (process.env.RANK_LEADER) ranks.push(`[${process.env.RANK_LEADER}]`);
        return ranks;
    }

    async init(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(`🔧 Initializing Staff Management Extension...`);

        this.api = api;
        this.config = { ...this.defaultConfig, ...(api.config || {}) };

        // Set up data file paths
        this.dataFilePath = path.join(process.cwd(), 'data', this.config.dataFile);
        this.banListPath = path.join(process.cwd(), 'data', this.config.banFile);

        // Create data directory if it doesn't exist
        await this.ensureDataDirectory();

        // Load existing analytics data and ban list
        await this.loadAnalyticsData();
        await this.loadBanList();

        // Remove any expired bans
        await this.removeExpiredBans();

        // Start ban enforcement cycle
        this.startBanEnforcementCycle(api);

        // Set up daily report scheduler
        if (this.config.dailyReports) {
            this.setupReportScheduler();
        }

        // Set up auto-save timer (every 15 minutes)
        this.setupAutoSave();

        // Set up event listeners for automatic logging
        this.setupEventListeners(api);

        api.log.success(`Staff Management Extension initialized successfully`);
    }

    async destroy(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(`Destroying Staff Management Extension...`);

        // Save analytics data before shutdown
        await this.saveAnalyticsData();

        // Clear intervals
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
        }
        if (this.banCheckInterval) {
            clearInterval(this.banCheckInterval);
        }
    }

    async onEnable(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(`Staff Management Extension enabled`);
    }

    async onDisable(context: any, api: ExtensionAPI): Promise<void> {
        // Clear timers
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
            this.reportInterval = null;
        }

        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }

        if (this.banCheckInterval) {
            clearInterval(this.banCheckInterval);
            this.banCheckInterval = null;
        }

        // Save any remaining data before shutdown
        try {
            await this.saveAnalyticsData();
            api.log.info('Final analytics data saved');
        } catch (error) {
            api.log.error('Failed to save analytics data on disable:', error);
        }

        api.log.info(`Staff Management Extension disabled`);
    }

    async healthCheck(): Promise<boolean> {
        return this.config.enabled !== false;
    }

    /**
     * Set up event listeners for automatic logging
     */
    private setupEventListeners(api: ExtensionAPI): void {
        // Note: Analytics logging is now handled via chat patterns in getChatPatterns()
        // instead of event listeners since the core events don't emit to extensions
        api.log.info('Analytics will be logged via chat patterns');
    }

    /**
     * Define chat patterns for commands
     */
    getChatPatterns(): ChatPattern[] {
        if (this.config.enabled === false) {
            return [];
        }

        return [
            // Analytics commands
            {
                id: 'analytics-weekly',
                extensionId: 'staff-management',
                pattern: /^!analytics\s+(weekly|week)\b/i,
                priority: 5,
                description: 'Shows weekly analytics (Staff only)',
                handler: this.handleAnalyticsWeekly.bind(this),
            },
            {
                id: 'analytics-monthly',
                extensionId: 'staff-management',
                pattern: /^!analytics\s+(monthly|month)\b/i,
                priority: 5,
                description: 'Shows monthly analytics (Staff only)',
                handler: this.handleAnalyticsMonthly.bind(this),
            },
            {
                id: 'analytics-today',
                extensionId: 'staff-management',
                pattern: /^!analytics\s+(today|daily)\b/i,
                priority: 5,
                description: "Shows today's analytics (Staff only)",
                handler: this.handleAnalyticsToday.bind(this),
            },
            {
                id: 'analytics-general',
                extensionId: 'staff-management',
                pattern: /^!analytics\b/i,
                priority: 10,
                description: 'Shows general analytics info (Staff only)',
                handler: this.handleAnalyticsGeneral.bind(this),
            },
            // Admin commands
            {
                id: 'reboot',
                extensionId: 'staff-management',
                pattern: /^!reboot\b/i,
                priority: 5,
                description: 'Forcefully restarts the bot (Admin only)',
                handler: this.handleReboot.bind(this),
            },
            {
                id: 'save-analytics',
                extensionId: 'staff-management',
                pattern: /^!save\b/i,
                priority: 5,
                description: 'Manually save analytics data (Staff only)',
                handler: this.handleSaveAnalytics.bind(this),
            },
            {
                id: 'stats-report',
                extensionId: 'staff-management',
                pattern: /^!statsreport\b/i,
                priority: 5,
                description: 'Manually trigger stats report to Discord (Staff only)',
                handler: this.handleStatsReport.bind(this),
            },
            {
                id: 'weekly-report',
                extensionId: 'staff-management',
                pattern: /^!weeklyreport\b/i,
                priority: 5,
                description: 'Manually trigger weekly stats report to Discord (Staff only)',
                handler: this.handleWeeklyReport.bind(this),
            },
            // Ban commands (Staff only)
            {
                id: 'guild-ban',
                extensionId: 'staff-management',
                pattern: /^!gban\s+(\S+)(?:\s+(.+))?/i,
                priority: 5,
                description: 'Ban a user from the guild (Staff only)',
                handler: this.handleGuildBan.bind(this),
            },
            {
                id: 'bridge-ban',
                extensionId: 'staff-management',
                pattern: /^!bridgeban\s+(\S+)(?:\s+(.+))?/i,
                priority: 5,
                description: 'Ban a user from using bridge (Staff only)',
                handler: this.handleBridgeBan.bind(this),
            },
            {
                id: 'command-ban',
                extensionId: 'staff-management',
                pattern: /^!cmdban\s+(\S+)(?:\s+(.+))?/i,
                priority: 5,
                description: 'Ban a user from using bridge and commands (Staff only)',
                handler: this.handleCommandBan.bind(this),
            },
            {
                id: 'unban',
                extensionId: 'staff-management',
                pattern: /^!unban\s+(\S+)/i,
                priority: 5,
                description: 'Unban a user (Staff only)',
                handler: this.handleUnban.bind(this),
            },
            {
                id: 'banlist',
                extensionId: 'staff-management',
                pattern: /^!banlist\b/i,
                priority: 5,
                description: 'Show all banned users (Staff only)',
                handler: this.handleBanlist.bind(this),
            },
            // Analytics logging patterns - PASSTHROUGH so they don't block other handlers
            {
                id: 'analytics-member-join-leave',
                extensionId: 'staff-management',
                pattern: /^(\[.*])?\s*(\w{2,17}).*? (joined|left) the guild!$/,
                priority: 1,
                passthrough: true,
                description: 'Logs member joins and leaves for analytics',
                handler: this.handleMemberJoinLeaveLog.bind(this),
            },
            // Urchin blacklist auto-check on guild join (toggleable via URCHIN_JOIN_CHECK env)
            {
                id: 'urchin-join-check',
                extensionId: 'staff-management',
                pattern: /^(\[.*])?\s*(\w{2,17}).*? joined the guild!$/,
                priority: 2,
                passthrough: true,
                description: 'Auto-checks new guild members against Urchin blacklist',
                handler: this.handleUrchinJoinCheck.bind(this),
            },
            {
                id: 'analytics-member-kick',
                extensionId: 'staff-management',
                pattern:
                    /^(\[.*])?\s*(\w{2,17}).*? was kicked from the guild by (\[.*])?\s*(\w{2,17}).*?!$/,
                priority: 1,
                passthrough: true,
                description: 'Logs member kicks for analytics',
                handler: this.handleMemberKickLog.bind(this),
            },
            {
                id: 'analytics-promote-demote',
                extensionId: 'staff-management',
                pattern: /^(\[.*])?\s*(\w{2,17}).*? was (promoted|demoted) from (.*) to (.*)$/,
                priority: 1,
                passthrough: true,
                description: 'Logs promotions and demotions for analytics',
                handler: this.handlePromoteDemoteLog.bind(this),
            },
            {
                id: 'analytics-guild-level-up',
                extensionId: 'staff-management',
                pattern: /^\s{19}The Guild has reached Level (\d*)!$/,
                priority: 1,
                passthrough: true,
                description: 'Logs guild level ups for analytics',
                handler: this.handleGuildLevelUpLog.bind(this),
            },
            {
                id: 'analytics-quest-complete',
                extensionId: 'staff-management',
                pattern: /^\s{17}GUILD QUEST COMPLETED!$/,
                priority: 1,
                passthrough: true,
                description: 'Logs quest completions for analytics',
                handler: this.handleQuestCompleteLog.bind(this),
            },
            {
                id: 'analytics-quest-tier-complete',
                extensionId: 'staff-management',
                pattern: /^\s{17}GUILD QUEST TIER (\d*) COMPLETED!$/,
                priority: 1,
                passthrough: true,
                description: 'Logs quest tier completions for analytics',
                handler: this.handleQuestTierCompleteLog.bind(this),
            },
            {
                id: 'analytics-guild-chat',
                extensionId: 'staff-management',
                pattern:
                    /^Guild > (?:\[[^\]]+\]\s+)?([A-Za-z0-9_]{3,16})(?:\s+\[[^\]]+\])?:\s*(.+)$/,
                priority: 500,
                passthrough: true,
                description: 'Logs guild chat messages for analytics',
                handler: this.handleGuildChatLog.bind(this),
            },
        ];
    }

    /**
     * Fetch actual guild rank from Hypixel API
     */
    private async fetchGuildRank(username: string): Promise<string | null> {
        try {
            // First, get UUID from username
            const mojangResponse = await fetch(
                `https://api.mojang.com/users/profiles/minecraft/${username}`
            );
            if (!mojangResponse.ok) {
                console.error(
                    `Failed to fetch Mojang profile for ${username}:`,
                    mojangResponse.statusText
                );
                return null;
            }
            const mojangProfile: any = await mojangResponse.json();
            if (!mojangProfile?.id) {
                console.error(`No UUID found for ${username}`);
                return null;
            }

            // Then fetch guild data
            const guildResponse = await fetch(
                `https://api.hypixel.net/guild?player=${mojangProfile.id}&key=${process.env.HYPIXEL_API_KEY}`
            );
            if (!guildResponse.ok) {
                console.error(
                    `Failed to fetch Hypixel guild data for ${username}:`,
                    guildResponse.statusText
                );
                return null;
            }
            const guildData: any = await guildResponse.json();
            if (!guildData?.guild?.members) {
                console.error(`No guild data found for ${username}`);
                return null;
            }

            // Find the member in the guild
            const member = guildData.guild.members.find((m: any) => m.uuid === mojangProfile.id);
            if (!member) {
                console.error(`User ${username} not found in guild members`);
                return null;
            }

            return member.rank;
        } catch (error) {
            console.error(`Error fetching guild rank for ${username}:`, error);
            return null;
        }
    }

    /**
     * Check if user has required permissions
     */
    private async hasPermission(
        context: ChatMessageContext,
        requiredRanks: string[]
    ): Promise<boolean> {
        let guildRank = context.guildRank;

        // If no guild rank in context, try to fetch from Hypixel API
        if (!guildRank || guildRank === 'Unknown') {
            console.log(`Fetching guild rank for ${context.username} from Hypixel API...`);
            const fetchedRank = await this.fetchGuildRank(context.username);
            if (!fetchedRank) {
                return false;
            }
            guildRank = fetchedRank;
        }

        // Compare with brackets intact - ensure guildRank has brackets
        const rankWithBrackets = guildRank.startsWith('[') ? guildRank : `[${guildRank}]`;
        return requiredRanks.includes(rankWithBrackets);
    }

    /**
     * Send a message to the correct channel based on context
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
     * Send multiple messages with delays to the correct channel
     */
    private async sendMultipleToChannel(
        context: ChatMessageContext,
        api: ExtensionAPI,
        messages: string[],
        delayMs: number = 500
    ): Promise<void> {
        for (const message of messages) {
            this.sendToChannel(context, api, message);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    /**
     * Send permission denied message
     */
    private async sendPermissionDenied(
        context: ChatMessageContext,
        api: ExtensionAPI,
        requiredRanks: string[]
    ): Promise<void> {
        let userRank = context.guildRank || 'Unknown';

        // If rank is unknown, try to fetch from Hypixel API
        if (userRank === 'Unknown') {
            const fetchedRank = await this.fetchGuildRank(context.username);
            if (fetchedRank) {
                userRank = fetchedRank.startsWith('[') ? fetchedRank : `[${fetchedRank}]`;
            }
        }

        const message = `Access denied. Your rank: ${userRank}, Required: ${requiredRanks.join(', ')}`;

        this.sendToChannel(context, api, message);
    }

    /**
     * Log an event to analytics
     */
    private async logEvent(type: string, playerName?: string): Promise<void> {
        const today = new Date().toISOString().split('T')[0];

        // Initialize today's stats if not exists
        if (!this.analyticsData.dailyStats[today]) {
            this.analyticsData.dailyStats[today] = {
                date: today,
                messagesReceived: 0,
                commandsUsed: 0,
                membersJoined: 0,
                membersLeft: 0,
                membersKicked: 0,
                promotions: 0,
                demotions: 0,
                guildLevelUps: 0,
                questsCompleted: 0,
                activeUsers: new Set(),
                topChatters: {},
            };
        }

        const dayStats = this.analyticsData.dailyStats[today];

        switch (type) {
            case 'message':
                dayStats.messagesReceived++;
                this.analyticsData.totalStats.totalMessages++;
                if (playerName) {
                    dayStats.activeUsers.add(playerName);
                    dayStats.topChatters[playerName] = (dayStats.topChatters[playerName] || 0) + 1;
                }
                break;
            case 'command':
                dayStats.commandsUsed++;
                this.analyticsData.totalStats.totalCommands++;
                if (playerName) {
                    dayStats.activeUsers.add(playerName);
                }
                break;
            case 'join':
                dayStats.membersJoined++;
                this.analyticsData.totalStats.totalJoins++;
                break;
            case 'leave':
                dayStats.membersLeft++;
                this.analyticsData.totalStats.totalLeaves++;
                break;
            case 'kick':
                dayStats.membersKicked++;
                this.analyticsData.totalStats.totalKicks++;
                break;
            case 'promotion':
                dayStats.promotions++;
                this.analyticsData.totalStats.totalPromotions++;
                break;
            case 'demotion':
                dayStats.demotions++;
                this.analyticsData.totalStats.totalDemotions++;
                break;
            case 'levelup':
                dayStats.guildLevelUps++;
                this.analyticsData.totalStats.totalLevelUps++;
                break;
            case 'quest':
                dayStats.questsCompleted++;
                this.analyticsData.totalStats.totalQuests++;
                break;
        }

        // Auto-save every 10 events to prevent data loss
        if (this.analyticsData.totalStats.totalMessages % 10 === 0) {
            await this.saveAnalyticsData();
        }
    }

    /**
     * Handle weekly analytics command
     */
    private async handleAnalyticsWeekly(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!(await this.hasPermission(context, this.analyticsRanks))) {
            await this.sendPermissionDenied(context, api, this.analyticsRanks);
            return;
        }

        const weekData = this.getWeeklyData();
        const message = this.formatWeeklyReport(weekData);

        this.sendToChannel(context, api, message);

        api.log.info(`Weekly analytics requested by ${context.username}`);
    }

    /**
     * Handle monthly analytics command
     */
    private async handleAnalyticsMonthly(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!(await this.hasPermission(context, this.analyticsRanks))) {
            await this.sendPermissionDenied(context, api, this.analyticsRanks);
            return;
        }

        const monthData = this.getMonthlyData();
        const message = this.formatMonthlyReport(monthData);

        this.sendToChannel(context, api, message);

        api.log.info(`Monthly analytics requested by ${context.username}`);
    }

    /**
     * Handle today's analytics command
     */
    private async handleAnalyticsToday(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!(await this.hasPermission(context, this.analyticsRanks))) {
            await this.sendPermissionDenied(context, api, this.analyticsRanks);
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const todayStats = this.analyticsData.dailyStats[today];

        let message: string;
        if (!todayStats) {
            message = 'No activity recorded for today yet.';
        } else {
            message = `Today's Stats: ${todayStats.messagesReceived} msgs | +${todayStats.membersJoined} joins | -${todayStats.membersLeft} leaves | ${todayStats.activeUsers.size} active users`;
        }

        this.sendToChannel(context, api, message);

        api.log.info(`Daily analytics requested by ${context.username}`);
    }

    /**
     * Handle general analytics command
     */
    private async handleAnalyticsGeneral(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!(await this.hasPermission(context, this.analyticsRanks))) {
            await this.sendPermissionDenied(context, api, this.analyticsRanks);
            return;
        }

        const total = this.analyticsData.totalStats;
        const message = `Total Stats: ${total.totalMessages} msgs | ${total.totalJoins} joins | ${total.totalLeaves} leaves | ${total.totalKicks} kicks | Use !analytics weekly/monthly/today`;

        this.sendToChannel(context, api, message);

        api.log.info(`General analytics requested by ${context.username}`);
    }

    /**
     * Handle reboot command
     */
    private async handleReboot(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        if (!(await this.hasPermission(context, this.adminRanks))) {
            await this.sendPermissionDenied(context, api, this.adminRanks);
            return;
        }

        api.log.warn(`Reboot command initiated by ${context.username} [${context.guildRank}]`);

        // Send confirmation message
        const message = `Bot reboot initiated by ${context.username}. Restarting in 3 seconds...`;
        this.sendToChannel(context, api, message);

        // Save analytics data before restart
        await this.saveAnalyticsData();

        // Wait 3 seconds then force crash for auto-restart
        setTimeout(() => {
            api.log.error(`Forcing bot restart as requested by ${context.username}`);
            process.exit(1); // Force exit for auto-restart
        }, 3000);
    }

    /**
     * Handle manual save analytics command
     */
    private async handleSaveAnalytics(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!(await this.hasPermission(context, this.analyticsRanks))) {
            await this.sendPermissionDenied(context, api, this.analyticsRanks);
            return;
        }

        api.log.info(`Manual save initiated by ${context.username} [${context.guildRank}]`);

        try {
            await this.saveAnalyticsData();

            const message = `Analytics data saved successfully by ${context.username}`;
            this.sendToChannel(context, api, message);

            api.log.success(`Analytics data manually saved by ${context.username}`);
        } catch (error) {
            const errorMessage = `Failed to save analytics data: ${error}`;
            this.sendToChannel(context, api, errorMessage);

            api.log.error(`Failed to manually save analytics data:`, error);
        }
    }

    /**
     * Handle manual stats report command
     */
    private async handleStatsReport(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        if (!(await this.hasPermission(context, this.analyticsRanks))) {
            await this.sendPermissionDenied(context, api, this.analyticsRanks);
            return;
        }

        api.log.info(
            `Manual daily stats report initiated by ${context.username} [${context.guildRank}]`
        );

        try {
            await this.sendDailyReport();

            const message = `Daily stats report sent to Discord by ${context.username}`;
            this.sendToChannel(context, api, message);

            api.log.success(`Daily stats report manually sent by ${context.username}`);
        } catch (error) {
            const errorMessage = `Failed to send daily stats report: ${error}`;
            this.sendToChannel(context, api, errorMessage);

            api.log.error(`Failed to manually send daily stats report:`, error);
        }
    }

    /**
     * Handle manual weekly report command
     */
    private async handleWeeklyReport(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!(await this.hasPermission(context, this.analyticsRanks))) {
            await this.sendPermissionDenied(context, api, this.analyticsRanks);
            return;
        }

        api.log.info(
            `Manual weekly report initiated by ${context.username} [${context.guildRank}]`
        );

        try {
            await this.sendWeeklyReport();

            const message = `Weekly report sent to Discord by ${context.username}`;
            this.sendToChannel(context, api, message);

            api.log.success(`Weekly report manually sent by ${context.username}`);
        } catch (error) {
            const errorMessage = `Failed to send weekly report: ${error}`;
            this.sendToChannel(context, api, errorMessage);

            api.log.error(`Failed to manually send weekly report:`, error);
        }
    }

    /**
     * Ban system handlers
     */

    /**
     * Parse duration string and convert to DD/MM/YYYY format
     * Supports: 5m (minutes), 30d (days), 6mo (months), 1y (years), never, or DD/MM/YYYY
     */
    private parseDuration(duration: string): string {
        // If it's already in DD/MM/YYYY format, return as-is
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(duration)) {
            return duration;
        }

        // If it's "never", return as-is
        if (duration.toLowerCase() === 'never') {
            return 'Never';
        }

        // Parse duration patterns
        const minuteMatch = duration.match(/^(\d+)m$/i);
        const dayMatch = duration.match(/^(\d+)d$/i);
        const monthMatch = duration.match(/^(\d+)mo$/i);
        const yearMatch = duration.match(/^(\d+)y$/i);

        const now = new Date();
        let targetDate: Date;

        if (minuteMatch) {
            const minutes = parseInt(minuteMatch[1]);
            targetDate = new Date(now.getTime() + minutes * 60 * 1000);
        } else if (dayMatch) {
            const days = parseInt(dayMatch[1]);
            targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        } else if (monthMatch) {
            const months = parseInt(monthMatch[1]);
            targetDate = new Date(now);
            targetDate.setMonth(targetDate.getMonth() + months);
        } else if (yearMatch) {
            const years = parseInt(yearMatch[1]);
            targetDate = new Date(now);
            targetDate.setFullYear(targetDate.getFullYear() + years);
        } else {
            // Invalid format, return the original
            return duration;
        }

        // Format as DD/MM/YYYY
        const day = String(targetDate.getDate()).padStart(2, '0');
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const year = targetDate.getFullYear();

        return `${day}/${month}/${year}`;
    }

    /**
     * Fetch Mojang UUID for a username
     */
    private async fetchMojangUUID(
        username: string
    ): Promise<{ uuid: string; name: string } | null> {
        try {
            const response = await fetch(
                `https://api.mojang.com/users/profiles/minecraft/${username}`
            );
            if (!response.ok) return null;
            const data: any = await response.json();
            return { uuid: data.id, name: data.name };
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if a ban has expired
     */
    private isBanExpired(endDate: string): boolean {
        if (endDate.toLowerCase() === 'never') return false;

        // Parse DD/MM/YYYY format
        const [day, month, year] = endDate.split('/').map(Number);
        const expiryDate = new Date(year, month - 1, day);
        return new Date() > expiryDate;
    }

    /**
     * Remove expired bans
     */
    private async removeExpiredBans(): Promise<void> {
        const _before = this.banList.bans.length;

        // Filter out expired bans
        const activeBans = this.banList.bans.filter((ban) => !this.isBanExpired(ban.endDate));
        const expiredBans = this.banList.bans.filter((ban) => this.isBanExpired(ban.endDate));

        // Delete Discord messages and blacklist entries for expired guild bans
        for (const ban of expiredBans) {
            if (ban.type === 'guild') {
                try {
                    // Remove from main blacklist file
                    const blacklistPath = path.join(
                        process.cwd(),
                        'src',
                        'blacklist',
                        '_blacklist.json'
                    );
                    const blacklistData = await fs.readFile(blacklistPath, 'utf8');
                    const data = JSON.parse(blacklistData);

                    // Handle both old array format and new object format
                    const blacklist = Array.isArray(data) ? data : data.bans || [];
                    const index = blacklist.findIndex((entry: any) => entry.uuid === ban.uuid);

                    if (index !== -1) {
                        blacklist.splice(index, 1);
                        // Write in new format
                        await fs.writeFile(
                            blacklistPath,
                            JSON.stringify({ bans: blacklist }, null, 2)
                        );
                    }
                } catch (error) {
                    this.api?.log.error(
                        `Failed to remove expired ban from blacklist: ${ban.name}`,
                        error
                    );
                }
            }
        }

        this.banList.bans = activeBans;

        if (expiredBans.length > 0) {
            await this.saveBanList();
            this.api?.log.info(
                `🕒 Removed ${expiredBans.length} expired ban(s): ${expiredBans.map((b) => b.name).join(', ')}`
            );
        }
    }

    private async handleGuildBan(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        if (!(await this.hasPermission(context, this.banRanks))) {
            await this.sendPermissionDenied(context, api, this.banRanks);
            return;
        }

        // matches[1] = username, matches[2] = rest of arguments
        const targetUsername = context.matches?.[1];
        const restArgs = context.matches?.[2]?.split(' ') || [];

        if (!targetUsername || restArgs.length < 2) {
            await this.sendMultipleToChannel(context, api, [
                'Usage: !gban <username> <duration> <reason>',
                'Duration: 30d (days), 6mo (months), 1y (year), 5m (minutes), never, or DD/MM/YYYY',
                'Example: !gban Player123 30d Harassment',
            ]);
            return;
        }

        const durationInput = restArgs[0];
        const endDate = this.parseDuration(durationInput);
        const reason = restArgs.slice(1).join(' ');

        api.log.info(`🔨 Guild ban initiated by ${context.username} on ${targetUsername}`);

        // Fetch Mojang UUID
        const mojangProfile = await this.fetchMojangUUID(targetUsername);
        if (!mojangProfile) {
            this.sendToChannel(context, api, `Could not find Minecraft player: ${targetUsername}`);
            return;
        }

        // Check if already banned
        const existing = this.banList.bans.find((b) => b.uuid === mojangProfile.uuid);
        if (existing) {
            this.sendToChannel(
                context,
                api,
                `${mojangProfile.name} is already banned (${existing.type} ban)`
            );
            return;
        }

        let messageId: string | undefined;

        // Send to Discord blacklist channel if available
        try {
            if (api.discord && api.discord.sendEmbed && api.discord.channels.blacklist) {
                const embed = {
                    title: mojangProfile.name,
                    color: 0xff0000,
                    url: `http://plancke.io/hypixel/player/stats/${mojangProfile.uuid}`,
                    thumbnail: {
                        url: `https://visage.surgeplay.com/full/${mojangProfile.uuid}.png`,
                    },
                    fields: [
                        { name: 'End:', value: endDate, inline: false },
                        { name: 'Reason:', value: reason, inline: false },
                    ],
                    footer: {
                        text: mojangProfile.uuid,
                    },
                    timestamp: new Date().toISOString(),
                };

                const message = await api.discord.sendEmbed(api.discord.channels.blacklist, embed);
                messageId = message?.id;
            }
        } catch (error) {
            api.log.error('Failed to send blacklist embed:', error);
        }

        // Add to ban list
        this.banList.bans.push({
            name: mojangProfile.name,
            uuid: mojangProfile.uuid,
            endDate,
            reason,
            messageId,
            bannedBy: context.username,
            bannedAt: new Date().toISOString(),
            type: 'guild',
        });

        // Add to main blacklist file
        const blacklistPath = path.join(process.cwd(), 'src', 'blacklist', '_blacklist.json');
        try {
            const blacklistData = await fs.readFile(blacklistPath, 'utf8');
            const data = JSON.parse(blacklistData);

            // Handle both old array format and new object format
            const blacklist = Array.isArray(data) ? data : data.bans || [];

            if (!blacklist.some((entry: any) => entry.uuid === mojangProfile.uuid)) {
                blacklist.push({
                    name: mojangProfile.name,
                    uuid: mojangProfile.uuid,
                    endDate,
                    reason,
                    messageId,
                    bannedBy: context.username,
                    bannedAt: new Date().toISOString(),
                    type: 'guild',
                });
                // Write in new format
                await fs.writeFile(blacklistPath, JSON.stringify({ bans: blacklist }, null, 2));
            }
        } catch (error) {
            api.log.error('Failed to update blacklist:', error);
        }

        await this.saveBanList();

        // Kick from guild
        api.chat.executeCommand(
            `/g kick ${mojangProfile.name} Blacklisted by ${context.username}. Mistake? .gg/misc -> Appeal`
        );
        this.sendToChannel(
            context,
            api,
            `🔨 ${mojangProfile.name} has been guild banned by ${context.username} until ${endDate}`
        );
        api.log.success(`🔨 ${mojangProfile.name} guild banned by ${context.username}`);
    }

    private async handleBridgeBan(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        if (!(await this.hasPermission(context, this.banRanks))) {
            await this.sendPermissionDenied(context, api, this.banRanks);
            return;
        }

        // matches[1] = username, matches[2] = rest of arguments
        const targetUsername = context.matches?.[1];
        const restArgs = context.matches?.[2]?.split(' ') || [];

        if (!targetUsername || restArgs.length < 2) {
            await this.sendMultipleToChannel(context, api, [
                'Usage: !bridgeban <username> <duration> <reason>',
                'Duration: 30d (days), 6mo (months), 1y (year), 5m (minutes), never, or DD/MM/YYYY',
                'Example: !bridgeban Player123 7d Spam',
            ]);
            return;
        }

        const durationInput = restArgs[0];
        const endDate = this.parseDuration(durationInput);
        const reason = restArgs.slice(1).join(' ');

        api.log.info(`🚫 Bridge ban initiated by ${context.username} on ${targetUsername}`);

        const mojangProfile = await this.fetchMojangUUID(targetUsername);
        if (!mojangProfile) {
            this.sendToChannel(context, api, `Could not find Minecraft player: ${targetUsername}`);
            return;
        }

        const existing = this.banList.bans.find((b) => b.uuid === mojangProfile.uuid);
        if (existing) {
            this.sendToChannel(
                context,
                api,
                `${mojangProfile.name} is already banned (${existing.type} ban)`
            );
            return;
        }

        this.banList.bans.push({
            name: mojangProfile.name,
            uuid: mojangProfile.uuid,
            endDate,
            reason,
            bannedBy: context.username,
            bannedAt: new Date().toISOString(),
            type: 'bridge',
        });

        await this.saveBanList();

        this.sendToChannel(
            context,
            api,
            `🚫 ${mojangProfile.name} has been bridge banned by ${context.username} until ${endDate}`
        );
        api.log.success(`🚫 ${mojangProfile.name} bridge banned by ${context.username}`);
    }

    private async handleCommandBan(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        if (!(await this.hasPermission(context, this.banRanks))) {
            await this.sendPermissionDenied(context, api, this.banRanks);
            return;
        }

        // matches[1] = username, matches[2] = rest of arguments
        const targetUsername = context.matches?.[1];
        const restArgs = context.matches?.[2]?.split(' ') || [];

        if (!targetUsername || restArgs.length < 2) {
            await this.sendMultipleToChannel(context, api, [
                'Usage: !cmdban <username> <duration> <reason>',
                'Duration: 30d (days), 6mo (months), 1y (year), 5m (minutes), never, or DD/MM/YYYY',
                'Example: !cmdban Player123 14d Command abuse',
            ]);
            return;
        }

        const durationInput = restArgs[0];
        const endDate = this.parseDuration(durationInput);
        const reason = restArgs.slice(1).join(' ');

        api.log.info(`⛔ Command ban initiated by ${context.username} on ${targetUsername}`);

        const mojangProfile = await this.fetchMojangUUID(targetUsername);
        if (!mojangProfile) {
            this.sendToChannel(context, api, `Could not find Minecraft player: ${targetUsername}`);
            return;
        }

        const existing = this.banList.bans.find((b) => b.uuid === mojangProfile.uuid);
        if (existing) {
            this.sendToChannel(
                context,
                api,
                `${mojangProfile.name} is already banned (${existing.type} ban)`
            );
            return;
        }

        this.banList.bans.push({
            name: mojangProfile.name,
            uuid: mojangProfile.uuid,
            endDate,
            reason,
            bannedBy: context.username,
            bannedAt: new Date().toISOString(),
            type: 'command',
        });

        await this.saveBanList();

        this.sendToChannel(
            context,
            api,
            `⛔ ${mojangProfile.name} has been command banned by ${context.username} until ${endDate}`
        );
        api.log.success(`⛔ ${mojangProfile.name} command banned by ${context.username}`);
    }

    private async handleUnban(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        if (!(await this.hasPermission(context, this.banRanks))) {
            await this.sendPermissionDenied(context, api, this.banRanks);
            return;
        }

        const targetUsername = context.matches?.[1];
        if (!targetUsername) {
            api.chat.sendGuildChat('Usage: !unban <username>');
            return;
        }

        api.log.info(`Unban initiated by ${context.username} for ${targetUsername}`);

        // Try to fetch UUID
        const mojangProfile = await this.fetchMojangUUID(targetUsername);
        const searchUUID = mojangProfile?.uuid.toLowerCase();
        const searchName = targetUsername.toLowerCase();

        // Find and remove ban
        const banIndex = this.banList.bans.findIndex(
            (ban) =>
                ban.name.toLowerCase() === searchName ||
                (searchUUID && ban.uuid.toLowerCase() === searchUUID)
        );

        if (banIndex === -1) {
            api.chat.sendGuildChat(`${targetUsername} is not banned`);
            return;
        }

        const ban = this.banList.bans[banIndex];
        this.banList.bans.splice(banIndex, 1);

        // Remove from blacklist if it was a guild ban
        if (ban.type === 'guild') {
            const blacklistPath = path.join(process.cwd(), 'src', 'blacklist', '_blacklist.json');
            try {
                const blacklistData = await fs.readFile(blacklistPath, 'utf8');
                const data = JSON.parse(blacklistData);

                // Handle both old array format and new object format
                const blacklist = Array.isArray(data) ? data : data.bans || [];

                const blacklistIndex = blacklist.findIndex((entry: any) => entry.uuid === ban.uuid);
                if (blacklistIndex !== -1) {
                    blacklist.splice(blacklistIndex, 1);
                    // Write in new format
                    await fs.writeFile(blacklistPath, JSON.stringify({ bans: blacklist }, null, 2));
                }
            } catch (error) {
                api.log.error('Failed to update blacklist:', error);
            }
        }

        await this.saveBanList();
        api.chat.sendGuildChat(
            `${ban.name} has been unbanned by ${context.username} (was ${ban.type} banned)`
        );
        api.log.success(`${ban.name} unbanned by ${context.username}`);
    }

    private async handleBanlist(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        if (!(await this.hasPermission(context, this.banRanks))) {
            await this.sendPermissionDenied(context, api, this.banRanks);
            return;
        }

        const guildBans = this.banList.bans.filter((b) => b.type === 'guild');
        const bridgeBans = this.banList.bans.filter((b) => b.type === 'bridge');
        const cmdBans = this.banList.bans.filter((b) => b.type === 'command');

        // Send ban list via DMs to the requester
        const dm = (msg: string) => api.chat.sendPrivateMessage(context.username, msg);
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        // Notify the user in-channel that the list is being sent via DM
        this.sendToChannel(context, api, `${context.username}, check your DMs for the ban list.`);
        await delay(600);

        // Send header
        dm('Ban List:');
        await delay(500);

        // Send guild bans
        dm(`Guild Bans (${guildBans.length}):`);
        await delay(500);
        if (guildBans.length === 0) {
            dm('  None');
            await delay(500);
        } else {
            for (const ban of guildBans) {
                dm(`  ${ban.name} - Expires: ${ban.endDate} - Reason: ${ban.reason}`);
                await delay(500);
            }
        }

        // Send bridge bans
        dm(`Bridge Bans (${bridgeBans.length}):`);
        await delay(500);
        if (bridgeBans.length === 0) {
            dm('  None');
            await delay(500);
        } else {
            for (const ban of bridgeBans) {
                dm(`  ${ban.name} - Expires: ${ban.endDate} - Reason: ${ban.reason}`);
                await delay(500);
            }
        }

        // Send command bans
        dm(`Command Bans (${cmdBans.length}):`);
        await delay(500);
        if (cmdBans.length === 0) {
            dm('  None');
            await delay(500);
        } else {
            for (const ban of cmdBans) {
                dm(`  ${ban.name} - Expires: ${ban.endDate} - Reason: ${ban.reason}`);
                await delay(500);
            }
        }

        api.log.info(`Ban list sent via DM to ${context.username}`);
    }

    /**
     * Analytics logging handlers
     */
    private async handleGuildChatLog(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!this.config.enabled) {
            api.log.debug('Analytics disabled in config');
            return;
        }

        // Debug logging (only when debugMode is enabled)
        if (this.config.debugMode) {
            api.log.info(`ANALYTICS DEBUG - Raw: "${context.raw}"`);
            api.log.info(`ANALYTICS DEBUG - Channel: "${context.channel}"`);
            api.log.info(`ANALYTICS DEBUG - Username: "${context.username}"`);
            api.log.info(
                `ANALYTICS DEBUG - Matches: ${context.matches ? JSON.stringify(context.matches) : 'null'}`
            );
        }

        // Use the already matched groups from the pattern
        if (context.matches && context.matches.length >= 3) {
            const playerName = context.matches[1]; // First capture group is username
            const message = context.matches[2]; // Second capture group is message

            // Check if it's a command (starts with !)
            const isCommand = message.trim().startsWith('!');

            // Don't log bot's own command responses
            const isBotResponse = context.username === 'MiscManager' && message.includes('[');

            if (isBotResponse) {
                // Skip logging bot's command responses
                if (this.config.debugMode) {
                    api.log.info(`Skipped bot response from analytics`);
                }
                return;
            }

            if (isCommand) {
                await this.logEvent('command', playerName);
                if (this.config.debugMode) {
                    api.log.info(
                        `Logged command from ${playerName}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
                    );
                }
            } else {
                await this.logEvent('message', playerName);
                if (this.config.debugMode) {
                    api.log.info(
                        `Logged guild chat message from ${playerName}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
                    );
                }
            }
            return;
        }

        // Fallback: Only log if it was correctly parsed by the extension manager
        if (context.channel === 'Guild' || context.channel === 'Officer') {
            const playerName = context.username;
            const message = context.message;
            const isCommand = message.trim().startsWith('!');
            const isBotResponse = context.username === 'MiscManager' && message.includes('[');

            if (!isBotResponse) {
                await this.logEvent(isCommand ? 'command' : 'message', playerName);
                if (this.config.debugMode) {
                    api.log.info(
                        `Logged ${context.channel.toLowerCase()} ${isCommand ? 'command' : 'chat message'} from ${playerName}`
                    );
                }
            }
        } else {
            // Debug log for pattern mismatch
            if (this.config.debugMode) {
                api.log.warn(`Pattern matched but no groups found - Raw: "${context.raw}"`);
            }
        }
    }

    private async handleMemberJoinLeaveLog(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!this.config.enabled) return;

        // Pattern: [VIP+] username joined the guild! or [VIP+] username left the guild!
        // Core pattern: /^(\[.*])?\s*(\w{2,17}).*? (joined|left) the guild!$/
        const match = context.raw.match(/^(\[.*])?\s*(\w{2,17}).*? (joined|left) the guild!$/);
        if (!match) {
            if (this.config.debugMode) {
                api.log.warn(`Join/Leave pattern didn't match: "${context.raw}"`);
            }
            return;
        }

        const playerName = match[2]; // Second capture group is the username
        const action = match[3]; // Third capture group is 'joined' or 'left'

        if (action.toLowerCase() === 'joined') {
            await this.logEvent('join', playerName);
            api.log.info(`Logged guild join: ${playerName}`);
        } else if (action.toLowerCase() === 'left') {
            await this.logEvent('leave', playerName);
            api.log.info(`Logged guild leave: ${playerName}`);
        }
    }

    /**
     * Automatically check a newly joined guild member against the Urchin blacklist.
     * Sends results to officer chat. Toggleable via URCHIN_JOIN_CHECK env var.
     */
    private async handleUrchinJoinCheck(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        // Check if the feature is enabled
        if (process.env.URCHIN_JOIN_CHECK?.toLowerCase() !== 'true') return;

        const urchinApiKey = process.env.URCHIN_API_KEY;
        if (!urchinApiKey) {
            api.log.debug('Urchin join-check skipped: no URCHIN_API_KEY set');
            return;
        }

        const match = context.raw.match(/^(\[.*])?\s*(\w{2,17}).*? joined the guild!$/);
        if (!match) return;

        const playerName = match[2];
        api.log.info(`🔍 Urchin join-check: looking up ${playerName}...`);

        try {
            // Step 1: Get UUID from Mojang
            const mojangRes = await fetch(
                `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(playerName)}`,
                {
                    headers: {
                        'User-Agent': 'MiscellaneousBridge/2.6 (info@vliegenier04.dev)',
                        Accept: 'application/json',
                    },
                }
            );

            if (!mojangRes.ok) {
                api.log.warn(`Urchin join-check: failed to resolve UUID for ${playerName}`);
                return;
            }

            const mojangData: any = await mojangRes.json();
            const uuid = mojangData.id; // UUID without hyphens

            // Step 2: Query Urchin API
            const urchinRes = await fetch(
                `https://urchin.ws/player/${uuid}?key=${urchinApiKey}&sources=GAME,MANUAL,CHAT,ME,PARTY`,
                {
                    headers: {
                        'User-Agent': 'MiscellaneousBridge/2.6 (info@vliegenier04.dev)',
                        Accept: 'application/json',
                    },
                }
            );

            if (urchinRes.status === 404) {
                // Not tagged — all clear
                api.chat.sendOfficerChat(
                    `[Urchin] ${playerName} joined — no blacklist tags found ✓`
                );
                api.log.info(`Urchin join-check: ${playerName} is clean`);
                return;
            }

            if (!urchinRes.ok) {
                api.log.warn(
                    `Urchin join-check: API returned ${urchinRes.status} for ${playerName}`
                );
                return;
            }

            const urchinData: any = await urchinRes.json();

            if (!urchinData?.tags || urchinData.tags.length === 0) {
                api.chat.sendOfficerChat(
                    `[Urchin] ${playerName} joined — no blacklist tags found ✓`
                );
                api.log.info(`Urchin join-check: ${playerName} is clean`);
                return;
            }

            // Player IS tagged — warn in OC
            const tagCount = urchinData.tags.length;
            api.chat.sendOfficerChat(
                `⚠️ [Urchin] ${playerName} joined with ${tagCount} blacklist tag(s)!`
            );

            // Send each tag as a separate OC message with a small delay
            for (const tag of urchinData.tags) {
                const tagType = (tag.type || 'UNKNOWN').toUpperCase().replace(/ /g, '-');
                const reason = tag.reason || 'No reason given';
                await new Promise((resolve) => setTimeout(resolve, 600));
                api.chat.sendOfficerChat(`  [${tagType}] ${playerName} — ${reason}`);
            }

            api.log.warn(`Urchin join-check: ${playerName} has ${tagCount} tag(s)!`);
        } catch (error) {
            api.log.error(`Urchin join-check error for ${playerName}:`, error);
        }
    }

    private async handleServerJoinLeaveIgnore(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        // Match against raw message
        const match = context.raw.match(/^Guild > (\w{2,17}) (joined|left)\.$/);
        if (!match) return;

        const playerName = match[1];
        const type = match[2];
        api.log.debug(
            `🚫 Ignoring server ${type} for ${playerName} (not a guild membership change)`
        );
    }

    private async handleMemberKickLog(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!this.config.enabled) return;

        // Pattern: [VIP+] woulvii was kicked from the guild by [MVP++] Vliegenier04!
        // Core pattern: /^(\[.*])?\s*(\w{2,17}).*? was kicked from the guild by (\[.*])?\s*(\w{2,17}).*?!$/
        const match = context.raw.match(
            /^(\[.*])?\s*(\w{2,17}).*? was kicked from the guild by (\[.*])?\s*(\w{2,17}).*?!$/
        );
        if (!match) {
            if (this.config.debugMode) {
                api.log.warn(`Kick pattern didn't match: "${context.raw}"`);
            }
            return;
        }

        const playerName = match[2]; // Second capture group is the kicked player
        const kickerName = match[4]; // Fourth capture group is the kicker
        await this.logEvent('kick', playerName);
        api.log.info(`Logged guild kick: ${playerName} (kicked by ${kickerName})`);
    }

    private async handlePromoteDemoteLog(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!this.config.enabled) return;

        // Pattern: [MVP++] D_Jaystar was promoted from Elite Member to Doge
        // Core pattern: /^(\[.*])?\s*(\w{2,17}).*? was (promoted|demoted) from (.*) to (.*)$/
        const match = context.raw.match(
            /^(\[.*])?\s*(\w{2,17}).*? was (promoted|demoted) from (.*) to (.*)$/
        );
        if (!match) {
            if (this.config.debugMode) {
                api.log.warn(`Promote/Demote pattern didn't match: "${context.raw}"`);
            }
            return;
        }

        const playerName = match[2]; // Second capture group is the username
        const action = match[3]; // Third capture group is 'promoted' or 'demoted'
        const fromRank = match[4]; // Fourth capture group is the from rank
        const toRank = match[5]; // Fifth capture group is the to rank

        if (action.toLowerCase() === 'promoted') {
            await this.logEvent('promotion', playerName);
            api.log.info(`Logged guild promotion: ${playerName} from ${fromRank} to ${toRank}`);
        } else if (action.toLowerCase() === 'demoted') {
            await this.logEvent('demotion', playerName);
            api.log.info(`Logged guild demotion: ${playerName} from ${fromRank} to ${toRank}`);
        }
    }

    private async handleGuildLevelUpLog(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!this.config.enabled) return;

        // Pattern:                    The Guild has reached Level 123!
        // Core pattern: /^\s{19}The Guild has reached Level (\d*)!$/
        // Note: Hypixel adds 19 spaces before the message
        const match = context.raw.match(/^\s{19}The Guild has reached Level (\d*)!$/);
        if (!match) {
            if (this.config.debugMode) {
                api.log.warn(`Guild level up pattern didn't match: "${context.raw}"`);
            }
            return;
        }

        const newLevel = match[1];
        await this.logEvent('levelup', 'GUILD');
        api.log.info(`Logged guild level up to level ${newLevel}!`);
    }

    private async handleQuestCompleteLog(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!this.config.enabled) return;

        // Pattern:                 GUILD QUEST COMPLETED!
        // Core pattern: /^\s{17}GUILD QUEST COMPLETED!$/
        // Note: Hypixel adds 17 spaces before the message
        const match = context.raw.match(/^\s{17}GUILD QUEST COMPLETED!$/);
        if (!match) {
            if (this.config.debugMode) {
                api.log.warn(`Quest complete pattern didn't match: "${context.raw}"`);
            }
            return;
        }

        await this.logEvent('quest', 'GUILD');
        api.log.info(`Logged guild quest completion!`);
    }

    private async handleQuestTierCompleteLog(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        if (!this.config.enabled) return;

        // Pattern:                 GUILD QUEST TIER 1 COMPLETED!
        // Core pattern: /^\s{17}GUILD QUEST TIER (\d*) COMPLETED!$/
        // Note: Hypixel adds 17 spaces before the message
        const match = context.raw.match(/^\s{17}GUILD QUEST TIER (\d*) COMPLETED!$/);
        if (!match) {
            if (this.config.debugMode) {
                api.log.warn(`Quest tier complete pattern didn't match: "${context.raw}"`);
            }
            return;
        }

        const tier = match[1];
        await this.logEvent('quest', 'GUILD');
        api.log.info(`Logged guild quest tier ${tier} completion!`);
    }

    /**
     * Get weekly data
     */
    private getWeeklyData(): any {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        let totalMessages = 0;
        let totalCommands = 0;
        let totalJoins = 0;
        let totalLeaves = 0;
        let totalKicks = 0;
        const activeUsers = new Set<string>();

        for (let d = new Date(weekAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayStats = this.analyticsData.dailyStats[dateStr];

            if (dayStats) {
                totalMessages += dayStats.messagesReceived;
                totalCommands += dayStats.commandsUsed || 0;
                totalJoins += dayStats.membersJoined;
                totalLeaves += dayStats.membersLeft;
                totalKicks += dayStats.membersKicked;
                dayStats.activeUsers.forEach((user) => activeUsers.add(user));
            }
        }

        return {
            totalMessages,
            totalCommands,
            totalJoins,
            totalLeaves,
            totalKicks,
            activeUsers: activeUsers.size,
            period: '7 days',
        };
    }

    /**
     * Get monthly data
     */
    private getMonthlyData(): any {
        const today = new Date();
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        let totalMessages = 0;
        let totalCommands = 0;
        let totalJoins = 0;
        let totalLeaves = 0;
        let totalKicks = 0;
        const activeUsers = new Set<string>();

        for (let d = new Date(monthAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayStats = this.analyticsData.dailyStats[dateStr];

            if (dayStats) {
                totalMessages += dayStats.messagesReceived;
                totalCommands += dayStats.commandsUsed || 0;
                totalJoins += dayStats.membersJoined;
                totalLeaves += dayStats.membersLeft;
                totalKicks += dayStats.membersKicked;
                dayStats.activeUsers.forEach((user) => activeUsers.add(user));
            }
        }

        return {
            totalMessages,
            totalCommands,
            totalJoins,
            totalLeaves,
            totalKicks,
            activeUsers: activeUsers.size,
            period: '30 days',
        };
    }

    /**
     * Format weekly report
     */
    private formatWeeklyReport(data: any): string {
        return `Weekly Report: ${data.totalMessages} msgs | +${data.totalJoins} joins | -${data.totalLeaves} leaves | ${data.activeUsers} active members`;
    }

    /**
     * Format monthly report
     */
    private formatMonthlyReport(data: any): string {
        return `Monthly Report: ${data.totalMessages} msgs | +${data.totalJoins} joins | -${data.totalLeaves} leaves | ${data.activeUsers} active members`;
    }

    /**
     * Set up daily report scheduler
     */
    private setupReportScheduler(): void {
        // Check every 10 minutes if it's time for a daily report
        this.reportInterval = setInterval(
            async () => {
                await this.checkDailyReport();
            },
            10 * 60 * 1000
        ); // Every 10 minutes (more frequent to catch 6 PM)
    }

    /**
     * Set up auto-save timer (every 15 minutes)
     */
    private setupAutoSave(): void {
        // Save analytics data and ban list every 15 minutes
        this.saveInterval = setInterval(
            async () => {
                try {
                    await this.saveAnalyticsData();
                    await this.saveBanList();
                    if (this.api?.log) {
                        this.api.log.info('Auto-saved analytics and ban data');
                    }
                } catch (error) {
                    if (this.api?.log) {
                        this.api.log.error('Failed to auto-save data:', error);
                    }
                }
            },
            15 * 60 * 1000
        ); // Every 15 minutes
    }

    /**
     * Check if it's time for daily report (6 PM EST)
     */
    private async checkDailyReport(): Promise<void> {
        const now = new Date();

        // Convert to EST (UTC-5 during standard time, UTC-4 during daylight time)
        // For simplicity, using UTC-5 (EST)
        const estOffset = -5 * 60; // EST is UTC-5
        const estTime = new Date(now.getTime() + (estOffset + now.getTimezoneOffset()) * 60000);
        const estHour = estTime.getHours();
        const estMinute = estTime.getMinutes();

        const today = now.toISOString().split('T')[0];
        const lastReportDate = this.analyticsData.lastReportDate || '2024-01-01';

        // Check if it's between 6:00 PM and 6:59 PM EST and we haven't sent a report today
        if (estHour === 18 && today !== lastReportDate) {
            this.api?.log.info(
                `Sending daily report at ${estHour}:${estMinute.toString().padStart(2, '0')} EST`
            );
            await this.sendDailyReport();
            this.analyticsData.lastReportDate = today;
            await this.saveAnalyticsData();
        }
    }

    /**
     * Get today's stats
     */
    private getTodayData(): any {
        const today = new Date().toISOString().split('T')[0];
        const todayStats = this.analyticsData.dailyStats[today];

        if (!todayStats) {
            return {
                totalMessages: 0,
                totalCommands: 0,
                totalJoins: 0,
                totalLeaves: 0,
                totalKicks: 0,
                activeUsers: 0,
            };
        }

        return {
            totalMessages: todayStats.messagesReceived,
            totalCommands: todayStats.commandsUsed || 0,
            totalJoins: todayStats.membersJoined,
            totalLeaves: todayStats.membersLeft,
            totalKicks: todayStats.membersKicked,
            activeUsers: todayStats.activeUsers.size,
        };
    }

    /**
     * Send daily report to officer channel with Discord embed (today's stats only)
     */
    private async sendDailyReport(): Promise<void> {
        if (!this.api) return;

        const todayData = this.getTodayData();
        const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        try {
            // Send Discord embed
            if (
                this.api.discord &&
                this.api.discord.sendEmbed &&
                this.api.discord.channels.officer
            ) {
                const embed = {
                    title: `Daily Guild Report - ${today}`,
                    color: 0x3498db,
                    fields: [
                        {
                            name: "Today's Activity",
                            value:
                                `💬 Messages: ${todayData.totalMessages}\n` +
                                `⚡ Commands: ${todayData.totalCommands}\n` +
                                `➕ Joins: ${todayData.totalJoins}\n` +
                                `➖ Leaves: ${todayData.totalLeaves}\n` +
                                `🔨 Kicks: ${todayData.totalKicks}\n` +
                                `👥 Active Users: ${todayData.activeUsers}`,
                            inline: false,
                        },
                    ],
                    footer: {
                        text: 'Automated daily report • Use !statsreport or !weeklyreport for more',
                    },
                    timestamp: new Date().toISOString(),
                };

                await this.api.discord.sendEmbed(this.api.discord.channels.officer, embed);
                this.api.log.info('Daily report sent to officer channel');
            }
        } catch (error) {
            this.api.log.error('Failed to send daily report:', error);
        }
    }

    /**
     * Send weekly report to officer channel with Discord embed
     */
    private async sendWeeklyReport(): Promise<void> {
        if (!this.api) return;

        const weekData = this.getWeeklyData();
        const monthData = this.getMonthlyData();

        // Get top chatters
        const topChatters = this.getTopChatters(10);
        const topChattersText =
            topChatters.length > 0
                ? topChatters
                      .map((entry, i) => `${i + 1}. ${entry.username}: ${entry.count} messages`)
                      .join('\n')
                : 'No data';

        try {
            // Send Discord embed
            if (
                this.api.discord &&
                this.api.discord.sendEmbed &&
                this.api.discord.channels.officer
            ) {
                const embed = {
                    title: 'Daily Guild Analytics Report',
                    color: 0x3498db,
                    fields: [
                        {
                            name: 'Last 7 Days',
                            value:
                                `💬 Messages: ${weekData.totalMessages}\n` +
                                `⚡ Commands: ${weekData.totalCommands}\n` +
                                `➕ Joins: ${weekData.totalJoins}\n` +
                                `➖ Leaves: ${weekData.totalLeaves}\n` +
                                `🔨 Kicks: ${weekData.totalKicks}\n` +
                                `👥 Active Users: ${weekData.activeUsers}`,
                            inline: true,
                        },
                        {
                            name: 'Last 30 Days',
                            value:
                                `💬 Messages: ${monthData.totalMessages}\n` +
                                `⚡ Commands: ${monthData.totalCommands}\n` +
                                `➕ Joins: ${monthData.totalJoins}\n` +
                                `➖ Leaves: ${monthData.totalLeaves}\n` +
                                `🔨 Kicks: ${monthData.totalKicks}\n` +
                                `👥 Active Users: ${monthData.activeUsers}`,
                            inline: true,
                        },
                        {
                            name: 'Top Chatters (7 Days)',
                            value: topChattersText,
                            inline: false,
                        },
                        {
                            name: '📈 All-Time Stats',
                            value:
                                `💬 Total Messages: ${this.analyticsData.totalStats.totalMessages}\n` +
                                `⚡ Total Commands: ${this.analyticsData.totalStats.totalCommands}\n` +
                                `➕ Total Joins: ${this.analyticsData.totalStats.totalJoins}\n` +
                                `⬆️ Promotions: ${this.analyticsData.totalStats.totalPromotions}\n` +
                                `Quests: ${this.analyticsData.totalStats.totalQuests}`,
                            inline: false,
                        },
                    ],
                    footer: {
                        text: "Weekly analytics report • Use !statsreport for today's stats",
                    },
                    timestamp: new Date().toISOString(),
                };

                await this.api.discord.sendEmbed(this.api.discord.channels.officer, embed);
                this.api.log.info('Weekly report sent to officer channel');
            }
        } catch (error) {
            this.api.log.error('Failed to send weekly report:', error);
        }
    }

    /**
     * Get top chatters from the last 7 days
     */
    private getTopChatters(limit: number = 10): Array<{ username: string; count: number }> {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const chatCounts: Record<string, number> = {};

        for (let d = new Date(weekAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayStats = this.analyticsData.dailyStats[dateStr];

            if (dayStats && dayStats.topChatters) {
                for (const [username, count] of Object.entries(dayStats.topChatters)) {
                    chatCounts[username] = (chatCounts[username] || 0) + count;
                }
            }
        }

        return Object.entries(chatCounts)
            .map(([username, count]) => ({ username, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Ensure data directory exists
     */
    private async ensureDataDirectory(): Promise<void> {
        const dataDir = path.dirname(this.dataFilePath);
        try {
            await fs.mkdir(dataDir, { recursive: true });
        } catch (error) {
            // Directory might already exist, ignore error
        }
    }

    /**
     * Load analytics data from file
     */
    private async loadAnalyticsData(): Promise<void> {
        try {
            const data = await fs.readFile(this.dataFilePath, 'utf8');
            const parsed = JSON.parse(data);

            // Convert activeUsers back to Set objects
            for (const date in parsed.dailyStats) {
                parsed.dailyStats[date].activeUsers = new Set(
                    parsed.dailyStats[date].activeUsers || []
                );
            }

            this.analyticsData = { ...this.analyticsData, ...parsed };

            if (this.api) {
                this.api.log.info(`Loaded analytics data from ${this.dataFilePath}`);
            }
        } catch (error) {
            if (this.api) {
                this.api.log.warn('No existing analytics data found, starting fresh');
            }
        }
    }

    /**
     * Save analytics data to file (preserving existing data)
     */
    private async saveAnalyticsData(): Promise<void> {
        try {
            // First, load any existing data from the file to preserve manual edits
            let existingData: any = {};
            try {
                const fileData = await fs.readFile(this.dataFilePath, 'utf8');
                existingData = JSON.parse(fileData);
            } catch (error) {
                // File doesn't exist or is invalid, start fresh
                existingData = { dailyStats: {}, totalStats: {}, lastReportDate: null };
            }

            // Convert Set objects to arrays for JSON serialization
            const dataToSave = {
                ...existingData,
                ...this.analyticsData,
                dailyStats: {
                    ...existingData.dailyStats,
                    ...Object.fromEntries(
                        Object.entries(this.analyticsData.dailyStats).map(([date, stats]) => [
                            date,
                            {
                                ...stats,
                                activeUsers: Array.from(stats.activeUsers),
                            },
                        ])
                    ),
                },
            };

            await fs.writeFile(this.dataFilePath, JSON.stringify(dataToSave, null, 2));

            if (this.api) {
                this.api.log.debug(
                    `Analytics data saved to ${this.dataFilePath} (preserving existing entries)`
                );
            }
        } catch (error) {
            if (this.api) {
                this.api.log.error('Failed to save analytics data:', error);
            }
        }
    }

    /**
     * Start the ban enforcement cycle.
     * Periodically fetches the guild member list from the Hypixel API
     * and kicks any members found in the ban list.
     */
    private startBanEnforcementCycle(api: ExtensionAPI): void {
        const intervalMinutes = parseInt(process.env.BAN_CHECK_INTERVAL || '10', 10);
        const intervalMs = intervalMinutes * 60 * 1000;

        api.log.info(
            `🔨 Ban enforcement cycle started — checking every ${intervalMinutes} minute(s)`
        );

        // Run once immediately on startup
        this.enforceBans(api).catch((err) =>
            api.log.error('Ban enforcement cycle error (initial):', err)
        );

        // Then repeat on the configured interval
        this.banCheckInterval = setInterval(() => {
            this.enforceBans(api).catch((err) =>
                api.log.error('Ban enforcement cycle error:', err)
            );
        }, intervalMs);
    }

    /**
     * Fetch the guild member list and kick any banned members.
     */
    private async enforceBans(api: ExtensionAPI): Promise<void> {
        // Only enforce guild bans (bridge/command bans don't require kicking)
        const guildBans = this.banList.bans.filter(
            (b) => b.type === 'guild' && !this.isBanExpired(b.endDate)
        );

        if (guildBans.length === 0) {
            api.log.debug('🔨 Ban enforcement: no active guild bans to enforce');
            return;
        }

        // Remove any expired bans first
        await this.removeExpiredBans();

        const guildName = process.env.HYPIXEL_GUILD_NAME;
        if (!guildName) {
            api.log.error('BAN ENFORCEMENT: HYPIXEL_GUILD_NAME not set in .env');
            return;
        }

        // Fetch guild data from Hypixel API
        let guildMembers: { uuid: string; rank: string }[];
        try {
            const res = await fetch(
                `https://api.hypixel.net/guild?name=${encodeURIComponent(guildName)}&key=${process.env.HYPIXEL_API_KEY}`
            );
            if (!res.ok) {
                api.log.error(`BAN ENFORCEMENT: Hypixel API returned ${res.status}`);
                return;
            }
            const data: any = await res.json();
            if (!data?.guild?.members) {
                api.log.error('BAN ENFORCEMENT: No guild member data returned');
                return;
            }
            guildMembers = data.guild.members;
        } catch (error) {
            api.log.error('BAN ENFORCEMENT: Failed to fetch guild data:', error);
            return;
        }

        // Build a set of member UUIDs currently in the guild (Hypixel UUIDs are un-dashed)
        const memberUUIDs = new Set(guildMembers.map((m) => m.uuid.replace(/-/g, '')));

        // Check each guild ban against current members
        let kickCount = 0;
        for (const ban of guildBans) {
            const banUUID = ban.uuid.replace(/-/g, '');
            if (memberUUIDs.has(banUUID)) {
                api.log.warn(
                    `🔨 Ban enforcement: kicking ${ban.name} (banned by ${ban.bannedBy}, reason: ${ban.reason})`
                );

                api.chat.executeCommand(
                    `/g kick ${ban.name} Banned by ${ban.bannedBy}. Reason: ${ban.reason}. Appeal: .gg/misc`
                );

                kickCount++;

                // Wait between kicks to avoid rate limits
                await new Promise((resolve) => setTimeout(resolve, 1500));
            }
        }

        if (kickCount > 0) {
            api.log.success(`🔨 Ban enforcement: kicked ${kickCount} banned member(s)`);
            api.chat.sendOfficerChat(
                `[Ban Enforcement] Kicked ${kickCount} banned member(s) from the guild`
            );
        } else {
            api.log.debug('🔨 Ban enforcement: no banned members found in guild');
        }
    }

    /**
     * Load ban list from file
     */
    private async loadBanList(): Promise<void> {
        try {
            const data = await fs.readFile(this.banListPath, 'utf8');
            this.banList = JSON.parse(data);

            if (this.api) {
                const totalBans = this.banList.bans.length;
                this.api.log.info(`🔨 Loaded ${totalBans} ban(s) from ${this.banListPath}`);
            }
        } catch (error) {
            if (this.api) {
                this.api.log.warn('🔨 No existing ban list found, starting fresh');
            }
        }
    }

    /**
     * Save ban list to file
     */
    private async saveBanList(): Promise<void> {
        try {
            await fs.writeFile(this.banListPath, JSON.stringify(this.banList, null, 2));

            if (this.api) {
                this.api.log.debug(`🔨 Ban list saved to ${this.banListPath}`);
            }
        } catch (error) {
            if (this.api) {
                this.api.log.error('Failed to save ban list:', error);
            }
        }
    }
}

export default StaffManagementExtension;
