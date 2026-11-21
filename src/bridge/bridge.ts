import { ActivityType } from 'discord.js';
import { consola } from 'consola';
import env from '@/config/env';
import { MinecraftBot } from '@/bot/bot';
import { DiscordClient } from '@/discord/client';
import { parseChatMessage } from '@/bot/chat-parser';
import { blacklistRepo } from '@/db/repositories/blacklist.repo';
import messageQueue from '@/queue/message-queue';
import { moduleManager, initModules } from '@/modules/index';
import { startHealthMonitor, incrementMetric } from '@/monitoring/health';
import { guildRankService } from '@/services/guild-ranks';

// Handlers
import { handleGuildChat } from '@/bot/handlers/guild-chat';
import { handleJoinLeave } from '@/bot/handlers/join-leave';
import { handleMemberJoinLeave } from '@/bot/handlers/member-join-leave';
import { handleMemberKick } from '@/bot/handlers/member-kick';
import { handlePromoteDemote } from '@/bot/handlers/promote-demote';
import { handleGuildMuteUnmute } from '@/bot/handlers/guild-mute-unmute';
import { announceInviter } from '@/bot/handlers/invites';
import {
    handleJoinLimbo,
    handleLobbyJoin,
    handleGuildLevelUp,
    handleMemberCount,
    handleJoinRequest,
    handleQuestComplete,
    handleQuestTierComplete,
    handleSameMessageTwice,
    handleCommentBlocked,
    handleWhisper,
} from '@/bot/handlers/misc';

export default class Bridge {
    public readonly bot: MinecraftBot;
    public readonly discord: DiscordClient;
    public onlineCount = 0;
    public totalCount = 125;

    constructor() {
        this.bot = new MinecraftBot();
        this.discord = new DiscordClient();
    }

    public async start(): Promise<void> {
        await Promise.all([this.discord.loadCommands(), this.discord.loadEvents(this)]);

        // Surface a missing or damaged data/blacklist.json at startup, not on the first join
        await blacklistRepo
            .getAll()
            .then((entries) => consola.info(`[Blacklist] ${entries.length} active entries`))
            .catch((err) => consola.error('[Blacklist] Could not load the blacklist:', err));

        this.setupBotHandlers();

        await this.discord.login(env.DISCORD_TOKEN);

        initModules(this);
        startHealthMonitor(this);

        // Fetch guild ranks from Hypixel API (for dynamic cooldown/staff checks)
        guildRankService
            .init(env.HYPIXEL_GUILD_NAME)
            .catch((err) => consola.warn('[GuildRanks] Init failed:', err));

        if (env.REMINDER_ENABLED && env.REMINDER_MESSAGE) {
            setInterval(
                () => {
                    this.bot.chat('gc', env.REMINDER_MESSAGE);
                },
                env.REMINDER_FREQUENCY * 60 * 1000
            );
        }

        // Periodic /g online to keep member count fresh
        setInterval(() => this.bot.execute('/g online'), 5 * 60 * 1000);

        consola.success('Bridge started!');
    }

    public setStatus(): void {
        if (!this.discord.isReady()) return;
        const count = Math.max(0, this.onlineCount - 1);
        this.discord.user.setActivity(`${count} online player${count !== 1 ? 's' : ''}`, {
            type: ActivityType.Watching,
        });
    }

    /**
     * Controlled MC relogin used by health monitor / terminal.
     * No-ops during intentional shutdown or when a reconnect is already pending.
     */
    public requestRelogin(reason: string): boolean {
        if (this.bot.isShuttingDown) {
            consola.info(`[Relogin] Skipped (${reason}) — shutting down`);
            return false;
        }
        if (this.bot.isReconnectPending) {
            consola.info(`[Relogin] Skipped (${reason}) — reconnect already pending`);
            return false;
        }
        this.bot.forceRelogin(reason);
        return true;
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
                    incrementMetric('messagesIn');
                    break;
                }
                case 'joinLeave':
                    await handleJoinLeave(this, event);
                    break;
                case 'memberJoinLeave':
                    await handleMemberJoinLeave(this, event);
                    if (event.status === 'joined') {
                        announceInviter(this, event.playerName).catch(() => {});
                    }
                    break;
                case 'memberKick':
                    await handleMemberKick(this, event);
                    break;
                case 'promoteDemote':
                    await handlePromoteDemote(this, event);
                    break;
                case 'guildMuteUnmute':
                    await handleGuildMuteUnmute(this, event);
                    break;
                case 'memberCount':
                    await handleMemberCount(this, event);
                    break;
                case 'joinRequest':
                    await handleJoinRequest(this, event);
                    break;
                case 'guildLevelUp':
                    await handleGuildLevelUp(this, event);
                    break;
                case 'joinLimbo':
                    await handleJoinLimbo(this, event);
                    break;
                case 'lobbyJoin':
                    await handleLobbyJoin(this, event);
                    break;
                case 'questComplete':
                    await handleQuestComplete(this, event);
                    break;
                case 'questTierComplete':
                    await handleQuestTierComplete(this, event);
                    break;
                case 'sameMessageTwice':
                    await handleSameMessageTwice(this, event);
                    break;
                case 'commentBlocked':
                    await handleCommentBlocked(this, event);
                    break;
                case 'whisper':
                    await handleWhisper(this, event);
                    break;
            }
        });

        // Re-wire Mineflayer lifecycle listeners after every connect/relogin
        this.bot.onLifecycle(() => this.wireBotLifecycle());

        // Limbo exhaustion → controlled relogin; process.exit remains last resort after N sessions
        this.bot.onLimboExhausted((reason) => {
            consola.warn(`[Limbo] Exhausted — requesting relogin (${reason})`);
            const started = this.requestRelogin(reason);
            if (!started) {
                consola.fatal('[Limbo] Relogin could not start after exhaustion. Exiting.');
                process.exit(1);
            }
        });

        // The one failure the bot can't recover from alone: someone has to enter the code
        this.bot.onSignInRequired((code) => {
            const minutes = Math.round(code.expires_in / 60);
            this.discord
                .send(
                    'oc',
                    `**MC sign-in needed** — Microsoft wants the bot's account to sign in again. ` +
                        `The link and code are in the server console (valid ~${minutes} min, a new code follows if it expires).`
                )
                .catch(() => {});
        });
    }

    private wireBotLifecycle(): void {
        // Listeners stay on the client they were added to, so skip events once it's replaced.
        // MinecraftBot tracks the state and reconnects; these handlers only report.
        const client = this.bot.bot;
        const isCurrent = () => this.bot.isCurrentClient(client);

        client.once('login', async () => {
            if (!isCurrent()) return;
            consola.success('Logged in to Hypixel!');
            await this.discord.send('gc', '**The bot has logged in and is now ready!**');
            setTimeout(() => {
                this.bot.execute('/g online');
                this.bot.ensureInLimbo('login');
            }, 3000);
        });

        // Also nudge limbo on spawn (covers some reconnect paths where login already fired)
        client.on('spawn', () => {
            if (isCurrent() && this.bot.state === 'connected') {
                this.bot.ensureInLimbo('spawn');
            }
        });

        client.on('end', (reason) => {
            if (!isCurrent()) return;
            consola.error(`Disconnected: ${reason}`);
            if (!this.bot.isShuttingDown) {
                this.discord.send('gc', `Disconnected: ${reason}`).catch(() => {});
            }
        });

        client.on('kicked', async (reason, loggedIn) => {
            if (!isCurrent()) return;
            consola.error(`Kicked: ${reason} (loggedIn=${loggedIn})`);
            if (!this.bot.isShuttingDown) {
                await this.discord.send('gc', `Bot was kicked: ${reason}`).catch(() => {});
            }
        });

        client.on('error', (err) => {
            if (isCurrent()) consola.error('Bot error:', err);
        });
    }

    public async shutdown(): Promise<void> {
        consola.info('Shutting down...');
        this.bot.markShuttingDown();
        messageQueue.clear();
        this.bot.disconnect();
        this.discord.destroy();
    }
}
