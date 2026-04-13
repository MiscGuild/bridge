import { ActivityType } from 'discord.js';
import { consola } from 'consola';
import env from '@/config/env';
import { MinecraftBot } from '@/bot/bot';
import { DiscordClient } from '@/discord/client';
import { parseChatMessage } from '@/bot/chat-parser';
import { applyFilters, FilterResult } from '@/bridge/filters/index';
import { blacklistRepo } from '@/db/repositories/blacklist.repo';
import { mutesRepo } from '@/db/repositories/mutes.repo';
import { bansRepo } from '@/db/repositories/bans.repo';
import messageQueue from '@/queue/message-queue';
import { moduleManager, initModules, trackEvent, trackGuildEvent } from '@/modules/index';
import { startHealthMonitor, incrementMetric } from '@/monitoring/health';

// Handlers
import { handleGuildChat } from '@/bot/handlers/guild-chat';
import { handleJoinLeave } from '@/bot/handlers/join-leave';
import { handleMemberJoinLeave } from '@/bot/handlers/member-join-leave';
import { handleMemberKick } from '@/bot/handlers/member-kick';
import { handlePromoteDemote } from '@/bot/handlers/promote-demote';
import { handleGuildMuteUnmute } from '@/bot/handlers/guild-mute-unmute';
import {
    handleJoinLimbo, handleLobbyJoin, handleGuildLevelUp,
    handleMemberCount, handleJoinRequest, handleQuestComplete,
    handleQuestTierComplete, handleSameMessageTwice, handleCommentBlocked,
    handleWhisper,
} from '@/bot/handlers/misc';
import { trackInviteOnJoin } from '@/modules/invite-tracker/index';
import { syncDiscordMuteRole } from '@/modules/mute-warn/index';

export default class Bridge {
    public readonly bot: MinecraftBot;
    public readonly discord: DiscordClient;
    public onlineCount = 0;
    public totalCount = 125;
    private readonly startedAt = Date.now();

    /** In-memory blacklist cache (fallback when Supabase is unavailable) */
    public readonly blacklist = {
        _set: new Set<string>(),
        isBlacklisted: (uuid: string) => this.blacklist._set.has(uuid),
        add: (uuid: string) => this.blacklist._set.add(uuid),
        remove: (uuid: string) => this.blacklist._set.delete(uuid),
    };

    /** In-memory ban cache */
    private bridgeBanned = new Set<string>();
    private commandBanned = new Set<string>();

    constructor() {
        this.bot = new MinecraftBot();
        this.discord = new DiscordClient();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.discord.loadCommands(),
            this.discord.loadEvents(this),
            this.loadBans(),
        ]);

        this.setupBotHandlers();

        await this.discord.login(env.DISCORD_TOKEN);

        initModules(this);
        startHealthMonitor(this);

        if (env.REMINDER_ENABLED && env.REMINDER_MESSAGE) {
            setInterval(() => {
                this.bot.chat('gc', env.REMINDER_MESSAGE);
            }, env.REMINDER_FREQUENCY * 60 * 1000);
        }

        // Periodic /g online to keep member count fresh
        setInterval(() => this.bot.execute('/g online'), 5 * 60 * 1000);

        // Periodic ban refresh
        setInterval(() => this.loadBans(), env.BAN_CHECK_INTERVAL * 60 * 1000);

        // Periodic blacklist expiry sweep (every hour)
        setInterval(async () => {
            const expired = await blacklistRepo.expireOverdue().catch(() => [] as string[]);
            for (const uuid of expired) this.blacklist.remove(uuid);
        }, 60 * 60 * 1000);

        // Periodic mute expiry sweep — remove Discord Muted role (every 5 minutes)
        setInterval(async () => {
            const expired = await mutesRepo.expireOverdue().catch(() => []);
            for (const mute of expired) {
                await syncDiscordMuteRole(this, mute.discord_id, false).catch(() => {});
            }
        }, 5 * 60 * 1000);

        consola.success('Bridge started!');
    }

    public setStatus(): void {
        if (!this.discord.isReady()) return;
        const count = Math.max(0, this.onlineCount - 1);
        this.discord.user.setActivity(`${count} online player${count !== 1 ? 's' : ''}`, {
            type: ActivityType.Watching,
        });
    }

    public filterMessage(content: string, username: string): FilterResult {
        // Check bridge ban
        if (this.bridgeBanned.has(username.toLowerCase())) {
            return { allowed: false, reason: 'you are bridge-banned and cannot send messages to Minecraft.' };
        }
        return applyFilters(content, username);
    }

    public get uptime(): number {
        return Date.now() - this.startedAt;
    }

    private setupBotHandlers(): void {
        this.bot.registerMessageHandler(async (raw: string) => {
            consola.info(raw);
            const event = parseChatMessage(raw);
            if (!event) return;

            switch (event.type) {
                case 'guildChat': {
                    // Always forward to Discord, then dispatch module commands
                    await handleGuildChat(this, event);
                    await moduleManager.dispatch(event, this);
                    trackEvent(event);
                    incrementMetric('messagesIn');
                    break;
                }
                case 'joinLeave':       await handleJoinLeave(this, event); break;
                case 'memberJoinLeave':
                    await handleMemberJoinLeave(this, event);
                    await trackGuildEvent(event, this);
                    if (event.status === 'joined') {
                        trackInviteOnJoin(this, event.playerName).catch(() => {});
                    }
                    trackEvent(event);
                    break;
                case 'memberKick':
                    await handleMemberKick(this, event);
                    await trackGuildEvent(event, this);
                    trackEvent(event);
                    break;
                case 'promoteDemote':
                    await handlePromoteDemote(this, event);
                    await trackGuildEvent(event, this);
                    trackEvent(event);
                    break;
                case 'guildMuteUnmute': await handleGuildMuteUnmute(this, event); break;
                case 'memberCount':     await handleMemberCount(this, event); break;
                case 'joinRequest':     await handleJoinRequest(this, event); break;
                case 'guildLevelUp':
                    await handleGuildLevelUp(this, event);
                    trackEvent(event);
                    break;
                case 'joinLimbo':       await handleJoinLimbo(this, event); break;
                case 'lobbyJoin':       await handleLobbyJoin(this, event); break;
                case 'questComplete':
                    await handleQuestComplete(this, event);
                    trackEvent(event);
                    break;
                case 'questTierComplete':
                    await handleQuestTierComplete(this, event);
                    trackEvent(event);
                    break;
                case 'sameMessageTwice': await handleSameMessageTwice(this, event); break;
                case 'commentBlocked':  await handleCommentBlocked(this, event); break;
                case 'whisper':         await handleWhisper(this, event); break;
            }
        });

        // Login event
        this.bot.bot.once('login', async () => {
            this.bot.state = 'connected';
            this.bot.limboAttempts = 0;
            consola.success('Logged in to Hypixel!');
            await this.discord.send('gc', '✅ **The bot has logged in and is now ready!**');
            setTimeout(() => {
                this.bot.execute('/g online');
                this.bot.sendToLimbo();
            }, 3000);
        });

        // End/kick events
        this.bot.bot.on('end', (reason) => {
            consola.error(`Disconnected: ${reason}`);
            this.bot.state = 'disconnected';
            this.discord.send('gc', `❌ Disconnected: ${reason}`).catch(() => {});
            this.bot.scheduleReconnect();
        });

        this.bot.bot.on('kicked', async (reason, loggedIn) => {
            consola.error(`Kicked: ${reason} (loggedIn=${loggedIn})`);
            this.bot.state = 'disconnected';
            await this.discord.send('gc', `❌ Bot was kicked: ${reason}`).catch(() => {});
            this.bot.scheduleReconnect();
        });

        this.bot.bot.on('error', (err) => {
            consola.error('Bot error:', err);
        });
    }

    public async loadBans(): Promise<void> {
        try {
            const bans = await bansRepo.getActive();
            this.bridgeBanned.clear();
            this.commandBanned.clear();
            for (const ban of bans) {
                if (ban.ban_type === 'bridge') this.bridgeBanned.add(ban.username.toLowerCase());
                if (ban.ban_type === 'command') this.commandBanned.add(ban.username.toLowerCase());
            }

            const blacklisted = await blacklistRepo.getAll();
            this.blacklist._set.clear();
            for (const entry of blacklisted) {
                this.blacklist._set.add(entry.uuid);
            }
        } catch {
            // Supabase may not be configured; silently skip
        }
    }

    public isCommandBanned(username: string): boolean {
        return this.commandBanned.has(username.toLowerCase());
    }

    public async shutdown(): Promise<void> {
        consola.info('Shutting down...');
        messageQueue.clear();
        this.bot.disconnect();
        this.discord.destroy();
    }
}
