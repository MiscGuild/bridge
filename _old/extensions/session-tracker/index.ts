/**
 * Session Tracker Extension v1.0
 *
 * Track individual game sessions for Bedwars, SkyWars, and Cops and Crims
 *
 * Commands:
 * - !session bw start - Start tracking a Bedwars session
 * - !session bw - Display current Bedwars session stats
 * - !session bw stop - Stop tracking and show final Bedwars session stats
 * - !session sw start/stop - SkyWars session tracking
 * - !session cvc start/stop - Cops and Crims session tracking
 *
 * @author MiscGuild Bridge Bot Team
 * @version 1.0.0
 */

interface ExtensionAPI {
    log: {
        info: (message: string) => void;
        error: (message: string) => void;
        warn: (message: string) => void;
        success: (message: string) => void;
        debug: (message: string) => void;
    };
    chat: {
        sendGuildChat: (message: string) => void;
        sendOfficerChat: (message: string) => void;
        sendPrivateMessage: (username: string, message: string) => void;
    };
    config?: any;
}

interface ChatMessageContext {
    username: string;
    message: string;
    channel: 'Guild' | 'Officer' | 'From';
    guildRank?: string;
    matches?: RegExpMatchArray | null;
}

interface ChatPattern {
    id: string;
    extensionId: string;
    pattern: RegExp;
    priority: number;
    description: string;
    passthrough?: boolean;
    handler: (context: ChatMessageContext, api: ExtensionAPI) => Promise<void>;
}

interface SessionData {
    uuid: string;
    username: string; // Store for display purposes
    game: string;
    startTime: number;
    startStats: GameStats;
}

interface CompletedSession {
    uuid: string;
    username: string; // Store for display purposes
    game: string;
    startTime: number;
    endTime: number;
    duration: number;
    startStats: GameStats;
    endStats: GameStats;
    gainedStats: GameStats;
}

interface GameStats {
    // Bedwars
    bw_wins?: number;
    bw_losses?: number;
    bw_final_kills?: number;
    bw_final_deaths?: number;
    bw_beds_broken?: number;
    bw_beds_lost?: number;
    bw_kills?: number;
    bw_deaths?: number;

    // SkyWars
    sw_wins?: number;
    sw_losses?: number;
    sw_kills?: number;
    sw_deaths?: number;

    // Cops and Crims
    cvc_wins?: number;
    cvc_kills?: number;
    cvc_deaths?: number;
    cvc_headshot_kills?: number;
}

interface MojangProfile {
    id: string;
    name: string;
}

interface FetchError {
    status: number;
    statusText: string;
}

class SessionTrackerExtension {
    manifest = {
        id: 'session-tracker',
        name: 'Session Tracker',
        version: '1.0.0',
        description: 'Track individual game sessions for Bedwars, SkyWars, and Cops and Crims',
        author: 'MiscGuild Bridge Bot Team',
    };

    private config: any = {};
    private api: ExtensionAPI | null = null;
    private activeSessions: Map<string, SessionData> = new Map();
    private sessionHistory: CompletedSession[] = [];

    // Profile caching to avoid rate limiting
    private profileCache: Map<string, { profile: MojangProfile; timestamp: number }> = new Map();
    private playerDataCache: Map<string, { data: any; timestamp: number }> = new Map();

    private activeSessionsFile = './data/active-sessions.json';
    private sessionHistoryFile = './data/session-history.json';

    private autoSaveInterval: NodeJS.Timeout | null = null;
    private cacheCleanupInterval: NodeJS.Timeout | null = null;

    private defaultConfig = {
        enabled: true,
        hypixelApiKey: process.env.HYPIXEL_API_KEY || '',
        supportedGames: ['bw', 'sw', 'cvc'],
        cacheExpiryTime: 15 * 60 * 1000, // 15 minutes
        profileCacheTTL: 5 * 60 * 1000, // 5 minutes for profile cache
        playerDataCacheTTL: 2 * 60 * 1000, // 2 minutes for player data cache
        autoSaveInterval: 5 * 60 * 1000, // Auto-save every 5 minutes
        maxHistoryPerUser: 50, // Maximum number of sessions to keep per user
    };

    async init(context: any, api: ExtensionAPI): Promise<void> {
        this.config = { ...this.defaultConfig, ...api.config };
        this.api = api;

        api.log.info('Initializing Session Tracker Extension...');

        if (!this.config.enabled) {
            api.log.warn('Session Tracker Extension is disabled in config');
            return;
        }

        if (!this.config.hypixelApiKey) {
            api.log.error(
                'Hypixel API key not found! Please set HYPIXEL_API_KEY environment variable'
            );
            return;
        }

        // Load active sessions and history from disk
        await this.loadActiveSessions();
        await this.loadSessionHistory();

        // Resume active sessions if any
        if (this.activeSessions.size > 0) {
            api.log.info(
                `Resuming ${this.activeSessions.size} active session(s) from before reboot`
            );
            for (const [_key, session] of this.activeSessions.entries()) {
                api.log.info(
                    `  - ${session.username} (${session.game.toUpperCase()}) - Started ${this.formatDuration(Date.now() - session.startTime)} ago`
                );
            }
        }

        // Start periodic auto-save
        this.startAutoSave();

        // Start cache cleanup
        this.startCacheCleanup();

        api.log.info(
            `Loaded ${this.activeSessions.size} active session(s) and ${this.sessionHistory.length} historical session(s)`
        );
        api.log.success('Session Tracker Extension initialized successfully');
    }

    getChatPatterns(): ChatPattern[] {
        const patterns: ChatPattern[] = [];

        // !session bw start (allows trailing text)
        patterns.push({
            id: 'session-bw-start',
            extensionId: 'session-tracker',
            pattern: /^!session\s+bw\s+start(?:\s|$)/i,
            priority: 1,
            description: 'Start tracking a Bedwars session',
            handler: this.handleSessionStart.bind(this, 'bw'),
        });

        // !session bw stop (allows trailing text)
        patterns.push({
            id: 'session-bw-stop',
            extensionId: 'session-tracker',
            pattern: /^!session\s+bw\s+stop(?:\s|$)/i,
            priority: 1,
            description: 'Stop tracking Bedwars session',
            handler: this.handleSessionStop.bind(this, 'bw'),
        });

        // !session bw (show current stats) - must be checked after start/stop
        patterns.push({
            id: 'session-bw-show',
            extensionId: 'session-tracker',
            pattern: /^!session\s+bw(?:\s|$)/i,
            priority: 2,
            description: 'Show current Bedwars session stats',
            handler: this.handleSessionShow.bind(this, 'bw'),
        });

        // !session sw start (allows trailing text)
        patterns.push({
            id: 'session-sw-start',
            extensionId: 'session-tracker',
            pattern: /^!session\s+sw\s+start(?:\s|$)/i,
            priority: 1,
            description: 'Start tracking a SkyWars session',
            handler: this.handleSessionStart.bind(this, 'sw'),
        });

        // !session sw stop (allows trailing text)
        patterns.push({
            id: 'session-sw-stop',
            extensionId: 'session-tracker',
            pattern: /^!session\s+sw\s+stop(?:\s|$)/i,
            priority: 1,
            description: 'Stop tracking SkyWars session',
            handler: this.handleSessionStop.bind(this, 'sw'),
        });

        // !session sw (show current stats) - must be checked after start/stop
        patterns.push({
            id: 'session-sw-show',
            extensionId: 'session-tracker',
            pattern: /^!session\s+sw(?:\s|$)/i,
            priority: 2,
            description: 'Show current SkyWars session stats',
            handler: this.handleSessionShow.bind(this, 'sw'),
        });

        // !session cvc start (allows trailing text)
        patterns.push({
            id: 'session-cvc-start',
            extensionId: 'session-tracker',
            pattern: /^!session\s+cvc\s+start(?:\s|$)/i,
            priority: 1,
            description: 'Start tracking a Cops and Crims session',
            handler: this.handleSessionStart.bind(this, 'cvc'),
        });

        // !session cvc stop (allows trailing text)
        patterns.push({
            id: 'session-cvc-stop',
            extensionId: 'session-tracker',
            pattern: /^!session\s+cvc\s+stop(?:\s|$)/i,
            priority: 1,
            description: 'Stop tracking Cops and Crims session',
            handler: this.handleSessionStop.bind(this, 'cvc'),
        });

        // !session cvc (show current stats) - must be checked after start/stop
        patterns.push({
            id: 'session-cvc-show',
            extensionId: 'session-tracker',
            pattern: /^!session\s+cvc(?:\s|$)/i,
            priority: 2,
            description: 'Show current Cops and Crims session stats',
            handler: this.handleSessionShow.bind(this, 'cvc'),
        });

        // !session history <game> - Show last 5 sessions for a game (allows trailing text)
        patterns.push({
            id: 'session-history',
            extensionId: 'session-tracker',
            pattern: /^!session\s+history\s+(bw|sw|cvc)(?:\s|$)/i,
            priority: 1,
            description: 'Show your last 5 sessions for a game',
            handler: this.handleSessionHistory.bind(this),
        });

        // !session stats <game> - Show overall stats from all sessions (allows trailing text)
        patterns.push({
            id: 'session-stats',
            extensionId: 'session-tracker',
            pattern: /^!session\s+stats\s+(bw|sw|cvc)(?:\s|$)/i,
            priority: 1,
            description: 'Show your overall stats from all sessions',
            handler: this.handleSessionStats.bind(this),
        });

        // !fsessionstop <username> - Force stop any user's session (staff only, allows trailing text)
        patterns.push({
            id: 'force-session-stop',
            extensionId: 'session-tracker',
            pattern: /^!fsessionstop\s+([A-Za-z0-9_]{1,16})(?:\s|$)/i,
            priority: 1,
            description: "Force stop a user's active session (Staff only)",
            handler: this.handleForceSessionStop.bind(this),
        });

        return patterns;
    }

    private async handleSessionStart(
        game: string,
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        const username = context.username;

        api.log.info(`${username} starting ${game} session`);

        try {
            // Fetch player UUID first
            const mojangProfile = await this.fetchMojangProfileCached(username);
            if (this.isFetchError(mojangProfile)) {
                const message = `${username}, could not find Minecraft profile. Please check your username. | ${this.getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                return;
            }

            const sessionKey = `${mojangProfile.id}-${game}`;

            // Check if session already exists - if so, stop it first
            if (this.activeSessions.has(sessionKey)) {
                const oldSession = this.activeSessions.get(sessionKey)!;

                // Fetch current stats to save the old session
                const endPlayerData = await this.fetchHypixelPlayerProfileCached(mojangProfile.id);
                if (!this.isFetchError(endPlayerData)) {
                    const endStats = this.extractGameStats(game, endPlayerData.stats);
                    await this.addToHistory(oldSession, endStats);
                }

                // Remove old session
                this.activeSessions.delete(sessionKey);

                const warningMessage = `${username}, your previous ${this.getGameName(game)} session was automatically stopped. Starting new session... | #FFA500`;
                this.sendToChannel(context, api, warningMessage);
            }

            const playerData = await this.fetchHypixelPlayerProfileCached(mojangProfile.id);
            if (this.isFetchError(playerData)) {
                const message = `${username}, failed to fetch Hypixel stats. Please try again later. | ${this.getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                return;
            }

            const currentStats = this.extractGameStats(game, playerData.stats);

            // Create session
            const session: SessionData = {
                uuid: mojangProfile.id,
                username: username,
                game: game,
                startTime: Date.now(),
                startStats: currentStats,
            };

            this.activeSessions.set(sessionKey, session);

            // Save to disk
            await this.saveActiveSessions();

            const message = `${username}, ${this.getGameName(game)} session started! Use !session ${game} to check progress or !session ${game} stop to end. | ${this.getRandomHexColor()}`;
            this.sendToChannel(context, api, message);
            api.log.success(`Started ${game} session for ${username}`);
        } catch (error) {
            api.log.error(`Error starting session for ${username}: ${error}`);
            const message = `${username}, an error occurred while starting your session. Please try again. | ${this.getRandomHexColor()}`;
            this.sendToChannel(context, api, message);
        }
    }

    private async handleSessionStop(
        game: string,
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        const username = context.username;

        try {
            // Fetch player UUID first
            const mojangProfile = await this.fetchMojangProfileCached(username);
            if (this.isFetchError(mojangProfile)) {
                const message = `${username}, could not fetch profile to end session. | ${this.getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                return;
            }

            const sessionKey = `${mojangProfile.id}-${game}`;

            // Check if session exists
            const session = this.activeSessions.get(sessionKey);
            if (!session) {
                const message = `${username}, you don't have an active ${this.getGameName(game)} session! Use !session ${game} start to begin tracking. | ${this.getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                return;
            }

            api.log.info(`${username} stopping ${game} session`);

            const playerData = await this.fetchHypixelPlayerProfileCached(mojangProfile.id);
            if (this.isFetchError(playerData)) {
                const message = `${username}, failed to fetch Hypixel stats. | ${this.getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                return;
            }

            const currentStats = this.extractGameStats(game, playerData.stats);
            const statsMessage = this.buildSessionStatsMessage(
                username,
                game,
                session,
                currentStats,
                true
            );

            // Add to history
            await this.addToHistory(session, currentStats);

            // Remove active session
            this.activeSessions.delete(sessionKey);

            // Save to disk
            await this.saveActiveSessions();

            this.sendToChannel(context, api, statsMessage);
            api.log.success(`Ended ${game} session for ${username}`);
        } catch (error) {
            api.log.error(`Error stopping session for ${username}: ${error}`);
            const message = `${username}, an error occurred while stopping your session. | ${this.getRandomHexColor()}`;
            this.sendToChannel(context, api, message);
        }
    }

    private async handleSessionShow(
        game: string,
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        const username = context.username;

        api.log.info(`${username} checking ${game} session`);

        try {
            // Fetch player UUID first
            const mojangProfile = await this.fetchMojangProfileCached(username);
            if (this.isFetchError(mojangProfile)) {
                const message = `${username}, could not fetch profile. | ${this.getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                return;
            }

            const sessionKey = `${mojangProfile.id}-${game}`;

            // Check if session exists
            const session = this.activeSessions.get(sessionKey);
            if (!session) {
                const message = `${username}, you don't have an active ${this.getGameName(game)} session! Use !session ${game} start to begin tracking. | ${this.getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                return;
            }

            const playerData = await this.fetchHypixelPlayerProfileCached(mojangProfile.id);
            if (this.isFetchError(playerData)) {
                const message = `${username}, failed to fetch Hypixel stats. | ${this.getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                return;
            }

            const currentStats = this.extractGameStats(game, playerData.stats);
            const statsMessage = this.buildSessionStatsMessage(
                username,
                game,
                session,
                currentStats,
                false
            );

            this.sendToChannel(context, api, statsMessage);
        } catch (error) {
            api.log.error(`Error showing session for ${username}: ${error}`);
            const message = `${username}, an error occurred while fetching your session stats. | ${this.getRandomHexColor()}`;
            this.sendToChannel(context, api, message);
        }
    }

    private async handleSessionHistory(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        const username = context.username;
        const game = context.matches?.[1]?.toLowerCase() || '';

        api.log.info(`${username} checking ${game} session history`);

        // Fetch player UUID
        const mojangProfile = await this.fetchMojangProfileCached(username);
        if (this.isFetchError(mojangProfile)) {
            const message = `${username}, could not find Minecraft profile. | ${this.getRandomHexColor()}`;
            this.sendToChannel(context, api, message);
            return;
        }

        // Get user's sessions for this game
        const userSessions = this.sessionHistory
            .filter((s) => s.uuid === mojangProfile.id && s.game === game)
            .sort((a, b) => b.endTime - a.endTime)
            .slice(0, 5); // Last 5 sessions

        if (userSessions.length === 0) {
            const message = `${username}, you don't have any completed ${this.getGameName(game)} sessions yet! | ${this.getRandomHexColor()}`;
            this.sendToChannel(context, api, message);
            return;
        }

        // Build summary message
        const gameName = this.getGameName(game);
        let message = `${username}'s Last ${userSessions.length} ${gameName} Sessions: `;

        for (let i = 0; i < userSessions.length; i++) {
            const session = userSessions[i];
            if (!session) continue; // Skip if undefined

            const duration = session.duration;
            const hours = Math.floor(duration / (1000 * 60 * 60));
            const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
            const durationStr = hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;

            if (game === 'bw') {
                const w = session.gainedStats.bw_wins || 0;
                const l = session.gainedStats.bw_losses || 0;
                const fk = session.gainedStats.bw_final_kills || 0;
                message += `${i + 1}) ${durationStr}: +${w}W/${l}L/${fk}FK | `;
            } else if (game === 'sw') {
                const w = session.gainedStats.sw_wins || 0;
                const l = session.gainedStats.sw_losses || 0;
                const k = session.gainedStats.sw_kills || 0;
                message += `${i + 1}) ${durationStr}: +${w}W/${l}L/${k}K | `;
            } else if (game === 'cvc') {
                const w = session.gainedStats.cvc_wins || 0;
                const k = session.gainedStats.cvc_kills || 0;
                message += `${i + 1}) ${durationStr}: +${w}W/${k}K | `;
            }
        }

        message += this.getRandomHexColor();
        this.sendToChannel(context, api, message);
    }

    private async handleSessionStats(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        const username = context.username;
        const game = context.matches?.[1]?.toLowerCase() || '';

        api.log.info(`${username} checking ${game} overall session stats`);

        // Fetch player UUID
        const mojangProfile = await this.fetchMojangProfileCached(username);
        if (this.isFetchError(mojangProfile)) {
            const message = `${username}, could not find Minecraft profile. | ${this.getRandomHexColor()}`;
            this.sendToChannel(context, api, message);
            return;
        }

        // Get all user's sessions for this game
        const userSessions = this.sessionHistory.filter(
            (s) => s.uuid === mojangProfile.id && s.game === game
        );

        if (userSessions.length === 0) {
            const message = `${username}, you don't have any completed ${this.getGameName(game)} sessions yet! | ${this.getRandomHexColor()}`;
            this.sendToChannel(context, api, message);
            return;
        }

        // Calculate totals
        const totals: GameStats = {};
        let totalDuration = 0;

        for (const session of userSessions) {
            totalDuration += session.duration;

            if (game === 'bw') {
                totals.bw_wins = (totals.bw_wins || 0) + (session.gainedStats.bw_wins || 0);
                totals.bw_losses = (totals.bw_losses || 0) + (session.gainedStats.bw_losses || 0);
                totals.bw_final_kills =
                    (totals.bw_final_kills || 0) + (session.gainedStats.bw_final_kills || 0);
                totals.bw_final_deaths =
                    (totals.bw_final_deaths || 0) + (session.gainedStats.bw_final_deaths || 0);
                totals.bw_beds_broken =
                    (totals.bw_beds_broken || 0) + (session.gainedStats.bw_beds_broken || 0);
                totals.bw_kills = (totals.bw_kills || 0) + (session.gainedStats.bw_kills || 0);
                totals.bw_deaths = (totals.bw_deaths || 0) + (session.gainedStats.bw_deaths || 0);
            } else if (game === 'sw') {
                totals.sw_wins = (totals.sw_wins || 0) + (session.gainedStats.sw_wins || 0);
                totals.sw_losses = (totals.sw_losses || 0) + (session.gainedStats.sw_losses || 0);
                totals.sw_kills = (totals.sw_kills || 0) + (session.gainedStats.sw_kills || 0);
                totals.sw_deaths = (totals.sw_deaths || 0) + (session.gainedStats.sw_deaths || 0);
            } else if (game === 'cvc') {
                totals.cvc_wins = (totals.cvc_wins || 0) + (session.gainedStats.cvc_wins || 0);
                totals.cvc_kills = (totals.cvc_kills || 0) + (session.gainedStats.cvc_kills || 0);
                totals.cvc_deaths =
                    (totals.cvc_deaths || 0) + (session.gainedStats.cvc_deaths || 0);
                totals.cvc_headshot_kills =
                    (totals.cvc_headshot_kills || 0) +
                    (session.gainedStats.cvc_headshot_kills || 0);
            }
        }

        const hours = Math.floor(totalDuration / (1000 * 60 * 60));
        const gameName = this.getGameName(game);

        let message = `${username}'s ${gameName} Session Stats (${userSessions.length} sessions, ${hours}h total): `;

        if (game === 'bw') {
            const w = totals.bw_wins || 0;
            const l = totals.bw_losses || 0;
            const fk = totals.bw_final_kills || 0;
            const fd = totals.bw_final_deaths || 0;
            const bb = totals.bw_beds_broken || 0;
            const fkdr = fd > 0 ? (fk / fd).toFixed(2) : fk.toFixed(2);
            const wlr = l > 0 ? (w / l).toFixed(2) : w.toFixed(2);
            message += `W: ${w} | L: ${l} | WLR: ${wlr} | FK: ${fk} | FD: ${fd} | FKDR: ${fkdr} | BB: ${bb}`;
        } else if (game === 'sw') {
            const w = totals.sw_wins || 0;
            const l = totals.sw_losses || 0;
            const k = totals.sw_kills || 0;
            const d = totals.sw_deaths || 0;
            const kdr = d > 0 ? (k / d).toFixed(2) : k.toFixed(2);
            const wlr = l > 0 ? (w / l).toFixed(2) : w.toFixed(2);
            message += `W: ${w} | L: ${l} | WLR: ${wlr} | K: ${k} | D: ${d} | KDR: ${kdr}`;
        } else if (game === 'cvc') {
            const w = totals.cvc_wins || 0;
            const k = totals.cvc_kills || 0;
            const d = totals.cvc_deaths || 0;
            const hs = totals.cvc_headshot_kills || 0;
            const kdr = d > 0 ? (k / d).toFixed(2) : k.toFixed(2);
            message += `W: ${w} | K: ${k} | D: ${d} | KDR: ${kdr} | HS: ${hs}`;
        }

        message += ` | ${this.getRandomHexColor()}`;
        this.sendToChannel(context, api, message);
    }

    private async handleForceSessionStop(
        context: ChatMessageContext,
        api: ExtensionAPI
    ): Promise<void> {
        const staffUsername = context.username;
        const staffRank = context.guildRank || '';
        const targetUsername = context.matches?.[1] || '';

        // Check if user has permission (Mod, Leader, GM)
        const allowedRanks = ['Mod', 'Leader', 'GM', 'Guild Master'];
        const hasPermission = allowedRanks.some((rank) => staffRank.includes(rank));

        if (!hasPermission) {
            const message = `${staffUsername}, you don't have permission to force stop sessions. Required rank: Mod, Leader, or GM. | ${this.getRandomHexColor()}`;
            this.sendToChannel(context, api, message);
            return;
        }

        api.log.info(`${staffUsername} [${staffRank}] forcing session stop for ${targetUsername}`);

        try {
            // Fetch target user's UUID first
            const mojangProfile = await this.fetchMojangProfileCached(targetUsername);
            if (this.isFetchError(mojangProfile)) {
                const message = `${staffUsername}, could not find profile for ${targetUsername}. | ${this.getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                return;
            }

            // Find all active sessions for this user by UUID
            const userSessions: Array<{ key: string; session: SessionData }> = [];
            for (const [key, session] of this.activeSessions.entries()) {
                if (session.uuid === mojangProfile.id) {
                    userSessions.push({ key, session });
                }
            }

            if (userSessions.length === 0) {
                const message = `${staffUsername}, ${targetUsername} doesn't have any active sessions. | ${this.getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                return;
            }

            const playerData = await this.fetchHypixelPlayerProfileCached(mojangProfile.id);
            if (this.isFetchError(playerData)) {
                const message = `${staffUsername}, failed to fetch Hypixel stats for ${targetUsername}. | ${this.getRandomHexColor()}`;
                this.sendToChannel(context, api, message);
                return;
            }

            // Stop all sessions for this user
            let stoppedCount = 0;
            for (const { key, session } of userSessions) {
                const currentStats = this.extractGameStats(session.game, playerData.stats);
                const statsMessage = this.buildSessionStatsMessage(
                    targetUsername,
                    session.game,
                    session,
                    currentStats,
                    true
                );

                // Add to history
                await this.addToHistory(session, currentStats);

                // Remove active session
                this.activeSessions.delete(key);
                stoppedCount++;

                // Send the session stats
                this.sendToChannel(context, api, statsMessage);
            }

            // Save to disk
            await this.saveActiveSessions();

            const summaryMessage = `${staffUsername} force-stopped ${stoppedCount} session(s) for ${targetUsername}. | ${this.getRandomHexColor()}`;
            this.sendToChannel(context, api, summaryMessage);
            api.log.success(
                `${staffUsername} force-stopped ${stoppedCount} session(s) for ${targetUsername}`
            );
        } catch (error) {
            api.log.error(`Error force stopping session for ${targetUsername}: ${error}`);
            const message = `${staffUsername}, an error occurred while force stopping the session. | ${this.getRandomHexColor()}`;
            this.sendToChannel(context, api, message);
        }
    }

    private extractGameStats(game: string, stats: any): GameStats {
        const gameStats: GameStats = {};

        if (game === 'bw') {
            const bw = stats?.Bedwars || {};
            gameStats.bw_wins = bw.wins_bedwars || 0;
            gameStats.bw_losses = bw.losses_bedwars || 0;
            gameStats.bw_final_kills = bw.final_kills_bedwars || 0;
            gameStats.bw_final_deaths = bw.final_deaths_bedwars || 0;
            gameStats.bw_beds_broken = bw.beds_broken_bedwars || 0;
            gameStats.bw_beds_lost = bw.beds_lost_bedwars || 0;
            gameStats.bw_kills = bw.kills_bedwars || 0;
            gameStats.bw_deaths = bw.deaths_bedwars || 0;
        } else if (game === 'sw') {
            const sw = stats?.SkyWars || {};
            gameStats.sw_wins = sw.wins || 0;
            gameStats.sw_losses = sw.losses || 0;
            gameStats.sw_kills = sw.kills || 0;
            gameStats.sw_deaths = sw.deaths || 0;
        } else if (game === 'cvc') {
            const cvc = stats?.MCGO || {};
            gameStats.cvc_wins = cvc.game_wins || 0;
            gameStats.cvc_kills = cvc.kills || 0;
            gameStats.cvc_deaths = cvc.deaths || 0;
            gameStats.cvc_headshot_kills = cvc.headshot_kills || 0;
        }

        return gameStats;
    }

    private buildSessionStatsMessage(
        username: string,
        game: string,
        session: SessionData,
        currentStats: GameStats,
        isFinal: boolean
    ): string {
        const duration = Date.now() - session.startTime;
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        const prefix = isFinal ? '[Session Ended]' : '[Session]';

        if (game === 'bw') {
            const winsGained = (currentStats.bw_wins || 0) - (session.startStats.bw_wins || 0);
            const lossesGained =
                (currentStats.bw_losses || 0) - (session.startStats.bw_losses || 0);
            const finalsGained =
                (currentStats.bw_final_kills || 0) - (session.startStats.bw_final_kills || 0);
            const fdeathsGained =
                (currentStats.bw_final_deaths || 0) - (session.startStats.bw_final_deaths || 0);
            const bedsGained =
                (currentStats.bw_beds_broken || 0) - (session.startStats.bw_beds_broken || 0);
            const killsGained = (currentStats.bw_kills || 0) - (session.startStats.bw_kills || 0);
            const deathsGained =
                (currentStats.bw_deaths || 0) - (session.startStats.bw_deaths || 0);

            const fkdr =
                fdeathsGained > 0
                    ? (finalsGained / fdeathsGained).toFixed(2)
                    : finalsGained.toFixed(2);
            const wlr =
                lossesGained > 0 ? (winsGained / lossesGained).toFixed(2) : winsGained.toFixed(2);

            return `${prefix} ${username} [BW] Duration: ${durationStr} | W: +${winsGained} | L: +${lossesGained} | FK: +${finalsGained} | FD: +${fdeathsGained} | FKDR: ${fkdr} | BB: +${bedsGained} | K: +${killsGained} | D: +${deathsGained} | WLR: ${wlr} | ${this.getRandomHexColor()}`;
        } else if (game === 'sw') {
            const winsGained = (currentStats.sw_wins || 0) - (session.startStats.sw_wins || 0);
            const lossesGained =
                (currentStats.sw_losses || 0) - (session.startStats.sw_losses || 0);
            const killsGained = (currentStats.sw_kills || 0) - (session.startStats.sw_kills || 0);
            const deathsGained =
                (currentStats.sw_deaths || 0) - (session.startStats.sw_deaths || 0);

            const kdr =
                deathsGained > 0 ? (killsGained / deathsGained).toFixed(2) : killsGained.toFixed(2);
            const wlr =
                lossesGained > 0 ? (winsGained / lossesGained).toFixed(2) : winsGained.toFixed(2);

            return `${prefix} ${username} [SW] Duration: ${durationStr} | W: +${winsGained} | L: +${lossesGained} | K: +${killsGained} | D: +${deathsGained} | KDR: ${kdr} | WLR: ${wlr} | ${this.getRandomHexColor()}`;
        } else if (game === 'cvc') {
            const winsGained = (currentStats.cvc_wins || 0) - (session.startStats.cvc_wins || 0);
            const killsGained = (currentStats.cvc_kills || 0) - (session.startStats.cvc_kills || 0);
            const deathsGained =
                (currentStats.cvc_deaths || 0) - (session.startStats.cvc_deaths || 0);
            const headshotGained =
                (currentStats.cvc_headshot_kills || 0) -
                (session.startStats.cvc_headshot_kills || 0);

            const kdr =
                deathsGained > 0 ? (killsGained / deathsGained).toFixed(2) : killsGained.toFixed(2);

            return `${prefix} ${username} [CvC] Duration: ${durationStr} | W: +${winsGained} | K: +${killsGained} | D: +${deathsGained} | HS: +${headshotGained} | KDR: ${kdr} | ${this.getRandomHexColor()}`;
        }

        return `${prefix} ${username} | Unknown game | ${this.getRandomHexColor()}`;
    }

    private getGameName(game: string): string {
        switch (game) {
            case 'bw':
                return 'Bedwars';
            case 'sw':
                return 'SkyWars';
            case 'cvc':
                return 'Cops and Crims';
            default:
                return game.toUpperCase();
        }
    }

    private async fetchMojangProfile(username: string): Promise<MojangProfile | FetchError> {
        try {
            const response = await fetch(
                `https://api.mojang.com/users/profiles/minecraft/${username}`
            );

            if (response.status !== 200) {
                return { status: response.status, statusText: response.statusText };
            }

            const data = (await response.json()) as any;
            return { id: data.id, name: data.name };
        } catch (error) {
            return { status: 500, statusText: 'Network error' };
        }
    }

    private async fetchHypixelPlayerProfile(uuid: string): Promise<any | FetchError> {
        try {
            const response = await fetch(
                `https://api.hypixel.net/player?key=${this.config.hypixelApiKey}&uuid=${uuid}`,
                {
                    headers: {
                        'User-Agent': 'MiscellaneousBridge/2.6 (info@vliegenier04.dev)',
                        Accept: 'application/json',
                    },
                }
            );

            if (response.status !== 200) {
                return { status: response.status, statusText: response.statusText };
            }

            const data = (await response.json()) as any;

            if (!data.success || !data.player) {
                return { status: 404, statusText: 'Player not found' };
            }

            return data.player;
        } catch (error) {
            return { status: 500, statusText: 'Network error' };
        }
    }

    private isFetchError(obj: any): obj is FetchError {
        return obj && typeof obj.status === 'number' && typeof obj.statusText === 'string';
    }

    private sendToChannel(context: ChatMessageContext, api: ExtensionAPI, message: string): void {
        if (context.channel === 'Officer') {
            api.chat.sendOfficerChat(message);
        } else if (context.channel === 'Guild') {
            api.chat.sendGuildChat(message);
        } else {
            api.chat.sendPrivateMessage(context.username, message);
        }
    }

    private getRandomHexColor(): string {
        return (
            '#' +
            Math.floor(Math.random() * 16777215)
                .toString(16)
                .padStart(6, '0')
        );
    }

    private async loadActiveSessions(): Promise<void> {
        try {
            const fs = require('fs').promises;
            const data = await fs.readFile(this.activeSessionsFile, 'utf-8');
            const sessionsArray: SessionData[] = JSON.parse(data);

            // Convert array back to Map
            this.activeSessions.clear();
            for (const session of sessionsArray) {
                // Use uuid-game as key (same format as when creating sessions)
                const key = `${session.uuid}-${session.game}`;
                this.activeSessions.set(key, session);
            }

            if (this.api) {
                this.api.log.info(`Loaded ${sessionsArray.length} active session(s) from disk`);
            }
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                // File doesn't exist yet, that's okay
                if (this.api) {
                    this.api.log.info('No active sessions file found, starting fresh');
                }
            } else {
                if (this.api) {
                    this.api.log.error(`Failed to load active sessions: ${error.message}`);
                }
            }
        }
    }

    private async saveActiveSessions(): Promise<void> {
        try {
            const fs = require('fs').promises;
            const path = require('path');

            // Ensure data directory exists
            const dir = path.dirname(this.activeSessionsFile);
            await fs.mkdir(dir, { recursive: true });

            // Convert Map to array for JSON serialization
            const sessionsArray = Array.from(this.activeSessions.values());

            await fs.writeFile(
                this.activeSessionsFile,
                JSON.stringify(sessionsArray, null, 2),
                'utf-8'
            );

            if (this.api) {
                this.api.log.debug(`Saved ${sessionsArray.length} active session(s) to disk`);
            }
        } catch (error: any) {
            if (this.api) {
                this.api.log.error(`Failed to save active sessions: ${error.message}`);
            }
        }
    }

    private async loadSessionHistory(): Promise<void> {
        try {
            const fs = require('fs').promises;
            const data = await fs.readFile(this.sessionHistoryFile, 'utf-8');
            this.sessionHistory = JSON.parse(data);

            if (this.api) {
                this.api.log.info(
                    `Loaded ${this.sessionHistory.length} historical session(s) from disk`
                );
            }
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                // File doesn't exist yet, that's okay
                if (this.api) {
                    this.api.log.info('No session history file found, starting fresh');
                }
                this.sessionHistory = [];
            } else {
                if (this.api) {
                    this.api.log.error(`Failed to load session history: ${error.message}`);
                }
                this.sessionHistory = [];
            }
        }
    }

    private async saveSessionHistory(): Promise<void> {
        try {
            const fs = require('fs').promises;
            const path = require('path');

            // Ensure data directory exists
            const dir = path.dirname(this.sessionHistoryFile);
            await fs.mkdir(dir, { recursive: true });

            await fs.writeFile(
                this.sessionHistoryFile,
                JSON.stringify(this.sessionHistory, null, 2),
                'utf-8'
            );

            if (this.api) {
                this.api.log.debug(
                    `Saved ${this.sessionHistory.length} historical session(s) to disk`
                );
            }
        } catch (error: any) {
            if (this.api) {
                this.api.log.error(`Failed to save session history: ${error.message}`);
            }
        }
    }

    private async addToHistory(session: SessionData, endStats: GameStats): Promise<void> {
        const completedSession: CompletedSession = {
            uuid: session.uuid,
            username: session.username,
            game: session.game,
            startTime: session.startTime,
            endTime: Date.now(),
            duration: Date.now() - session.startTime,
            startStats: session.startStats,
            endStats: endStats,
            gainedStats: this.calculateGainedStats(session.startStats, endStats),
        };

        // Add to history
        this.sessionHistory.push(completedSession);

        // Trim history per user if needed
        const userSessions = this.sessionHistory.filter(
            (s) => s.uuid === session.uuid && s.game === session.game
        );
        if (userSessions.length > this.config.maxHistoryPerUser) {
            // Remove oldest sessions for this user/game combo
            const toRemove = userSessions.length - this.config.maxHistoryPerUser;
            for (let i = 0; i < toRemove; i++) {
                const sessionToRemove = userSessions[i];
                if (!sessionToRemove) continue; // Skip if undefined
                const index = this.sessionHistory.indexOf(sessionToRemove);
                if (index > -1) {
                    this.sessionHistory.splice(index, 1);
                }
            }
        }

        // Save to disk
        await this.saveSessionHistory();
    }

    private calculateGainedStats(startStats: GameStats, endStats: GameStats): GameStats {
        const gained: GameStats = {};

        // Bedwars
        if (startStats.bw_wins !== undefined) {
            gained.bw_wins = (endStats.bw_wins || 0) - (startStats.bw_wins || 0);
            gained.bw_losses = (endStats.bw_losses || 0) - (startStats.bw_losses || 0);
            gained.bw_final_kills =
                (endStats.bw_final_kills || 0) - (startStats.bw_final_kills || 0);
            gained.bw_final_deaths =
                (endStats.bw_final_deaths || 0) - (startStats.bw_final_deaths || 0);
            gained.bw_beds_broken =
                (endStats.bw_beds_broken || 0) - (startStats.bw_beds_broken || 0);
            gained.bw_beds_lost = (endStats.bw_beds_lost || 0) - (startStats.bw_beds_lost || 0);
            gained.bw_kills = (endStats.bw_kills || 0) - (startStats.bw_kills || 0);
            gained.bw_deaths = (endStats.bw_deaths || 0) - (startStats.bw_deaths || 0);
        }

        // SkyWars
        if (startStats.sw_wins !== undefined) {
            gained.sw_wins = (endStats.sw_wins || 0) - (startStats.sw_wins || 0);
            gained.sw_losses = (endStats.sw_losses || 0) - (startStats.sw_losses || 0);
            gained.sw_kills = (endStats.sw_kills || 0) - (startStats.sw_kills || 0);
            gained.sw_deaths = (endStats.sw_deaths || 0) - (startStats.sw_deaths || 0);
        }

        // Cops and Crims
        if (startStats.cvc_wins !== undefined) {
            gained.cvc_wins = (endStats.cvc_wins || 0) - (startStats.cvc_wins || 0);
            gained.cvc_kills = (endStats.cvc_kills || 0) - (startStats.cvc_kills || 0);
            gained.cvc_deaths = (endStats.cvc_deaths || 0) - (startStats.cvc_deaths || 0);
            gained.cvc_headshot_kills =
                (endStats.cvc_headshot_kills || 0) - (startStats.cvc_headshot_kills || 0);
        }

        return gained;
    }

    /**
     * Start periodic auto-save of active sessions
     */
    private startAutoSave(): void {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(async () => {
            if (this.activeSessions.size > 0) {
                await this.saveActiveSessions();
                this.api?.log.debug('Auto-saved active sessions');
            }
        }, this.config.autoSaveInterval);

        this.api?.log.debug(`Auto-save enabled (every ${this.config.autoSaveInterval / 1000}s)`);
    }

    /**
     * Start cache cleanup interval
     */
    private startCacheCleanup(): void {
        if (this.cacheCleanupInterval) {
            clearInterval(this.cacheCleanupInterval);
        }

        this.cacheCleanupInterval = setInterval(() => {
            const now = Date.now();
            let profilesRemoved = 0;
            let dataRemoved = 0;

            // Clean expired profile cache
            for (const [username, cached] of this.profileCache.entries()) {
                if (now - cached.timestamp > this.config.profileCacheTTL) {
                    this.profileCache.delete(username);
                    profilesRemoved++;
                }
            }

            // Clean expired player data cache
            for (const [uuid, cached] of this.playerDataCache.entries()) {
                if (now - cached.timestamp > this.config.playerDataCacheTTL) {
                    this.playerDataCache.delete(uuid);
                    dataRemoved++;
                }
            }

            if (profilesRemoved > 0 || dataRemoved > 0) {
                this.api?.log.debug(
                    `Cache cleanup: removed ${profilesRemoved} profiles, ${dataRemoved} player data entries`
                );
            }
        }, 60 * 1000); // Clean every minute

        this.api?.log.debug('Cache cleanup enabled (every 60s)');
    }

    /**
     * Fetch Mojang profile with caching
     */
    private async fetchMojangProfileCached(username: string): Promise<MojangProfile | FetchError> {
        const cacheKey = username.toLowerCase();
        const cached = this.profileCache.get(cacheKey);
        const now = Date.now();

        // Return cached if still valid
        if (cached && now - cached.timestamp < this.config.profileCacheTTL) {
            this.api?.log.debug(`Using cached Mojang profile for ${username}`);
            return cached.profile;
        }

        // Fetch fresh profile
        const profile = await this.fetchMojangProfile(username);

        // Cache if successful
        if (!this.isFetchError(profile)) {
            this.profileCache.set(cacheKey, {
                profile,
                timestamp: now,
            });
            this.api?.log.debug(`Cached Mojang profile for ${username}`);
        }

        return profile;
    }

    /**
     * Fetch Hypixel player data with caching
     */
    private async fetchHypixelPlayerProfileCached(uuid: string): Promise<any | FetchError> {
        const cached = this.playerDataCache.get(uuid);
        const now = Date.now();

        // Return cached if still valid
        if (cached && now - cached.timestamp < this.config.playerDataCacheTTL) {
            this.api?.log.debug(`Using cached Hypixel data for UUID ${uuid.substring(0, 8)}...`);
            return cached.data;
        }

        // Fetch fresh data
        const data = await this.fetchHypixelPlayerProfile(uuid);

        // Cache if successful
        if (!this.isFetchError(data)) {
            this.playerDataCache.set(uuid, {
                data,
                timestamp: now,
            });
            this.api?.log.debug(`Cached Hypixel data for UUID ${uuid.substring(0, 8)}...`);
        }

        return data;
    }

    /**
     * Format duration in human-readable format
     */
    private formatDuration(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return `${seconds}s`;
        }
    }

    async cleanup(): Promise<void> {
        // Clear intervals
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }

        if (this.cacheCleanupInterval) {
            clearInterval(this.cacheCleanupInterval);
            this.cacheCleanupInterval = null;
        }

        // Save active sessions before cleanup
        await this.saveActiveSessions();

        this.activeSessions.clear();
        this.profileCache.clear();
        this.playerDataCache.clear();

        if (this.api) {
            this.api.log.info('Session Tracker Extension cleaned up');
        }
    }

    /**
     * Destroy method called when extension is being disabled/unloaded
     */
    async destroy(): Promise<void> {
        if (this.api) {
            this.api.log.info('Session Tracker Extension shutting down...');
        }

        // Save active sessions one final time before shutdown
        await this.saveActiveSessions();
        await this.saveSessionHistory();

        // Run cleanup
        await this.cleanup();

        if (this.api) {
            this.api.log.success('Session Tracker Extension shut down successfully');
        }
    }
}

module.exports = SessionTrackerExtension;
