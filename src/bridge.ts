import { ActivityType, IntentsBitField } from 'discord.js';
import { consola } from 'consola';
import env from './util/env';
import Discord from './discord/discord';
import Mineflayer from './mineflayer/mineflayer';
import MineflayerExtensionManager from './plugin-system/mineflayer-extension-manager';

export default class Bridge {
    public readonly discord = new Discord({
        allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
        intents: [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.MessageContent,
        ],
    });

    public readonly mineflayer = new Mineflayer();
    public readonly extensionManager = new MineflayerExtensionManager(this);
    public onlineCount = 0;
    public totalCount = 125;

    constructor() {
        try {
            this.start();
        } catch (error) {
            consola.error(error);
        }
    }

    public setStatus() {
        const plural = this.onlineCount - 1 !== 1;

        if (this.discord.isReady()) {
            this.discord.user.setActivity(
                `${this.onlineCount - 1} online player${plural ? 's' : ''}`,
                {
                    type: ActivityType.Watching,
                }
            );
        }
    }

    private async start() {
        // Load Discord stuff in parallel (doesn't depend on extensions)
        await Promise.all([this.discord.loadCommands(), this.discord.loadEvents(this)]);

        // Load and enable extensions
        consola.info('Loading Mineflayer extensions...');
        this.extensionManager.addExtensionDirectory('./extensions');
        await this.extensionManager.loadExtensions();
        await this.extensionManager.enableAllExtensions();

        // Log extension stats
        const stats = this.extensionManager.getExtensionStats();
        consola.info(
            `Extensions: ${stats.enabled}/${stats.total} enabled, ${stats.chatPatterns} patterns registered`
        );

        // Then load Mineflayer events (which need extensions to be loaded)
        await this.mineflayer.loadEvents(this);

        await this.discord.login(env.DISCORD_TOKEN);

        // Initialize terminal REPL if enabled
        if (env.ENABLE_TERMINAL === true) {
            this.initializeTerminalREPL();
        }
    }

    private initializeTerminalREPL() {
        if (!process.stdin.isTTY) {
            consola.warn('Terminal REPL: stdin is not a TTY, skipping initialization');
            return;
        }

        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'bridge> ',
        });

        consola.success(
            'Terminal REPL enabled. Type extension commands (!gexp, !session, etc.) or /gc, /oc, /pm, /cmd, help, quit'
        );
        rl.prompt();

        rl.on('line', async (line: string) => {
            const input = (line || '').trim();
            if (!input) {
                rl.prompt();
                return;
            }

            const parts = input.split(/\s+/);
            const cmd = parts[0]?.toLowerCase() || '';

            try {
                if (cmd === 'quit' || cmd === 'exit') {
                    consola.info('Terminal requested shutdown');
                    rl.close();
                    await this.shutdown();
                    process.exit(0);
                } else if (cmd === 'help') {
                    console.log('\nAvailable commands:');
                    console.log('  /gc <message>              - Send message to guild chat');
                    console.log('  /oc <message>              - Send message to officer chat');
                    console.log('  /pm <username> <message>   - Send private message');
                    console.log('  /cmd <command>             - Send raw Minecraft command');
                    console.log('  !<command>                 - Use any extension command (e.g., !gexp, !session)');
                    console.log('  help                       - Show this help message');
                    console.log('  quit/exit                  - Shutdown the bot\n');
                } else if (cmd === '/gc') {
                    const msg = parts.slice(1).join(' ');
                    if (!msg) {
                        consola.warn('Usage: /gc <message>');
                    } else {
                        this.mineflayer.chat('gc', msg);
                        consola.info(`[GC] ${msg}`);
                    }
                } else if (cmd === '/oc') {
                    const msg = parts.slice(1).join(' ');
                    if (!msg) {
                        consola.warn('Usage: /oc <message>');
                    } else {
                        this.mineflayer.chat('oc', msg);
                        consola.info(`[OC] ${msg}`);
                    }
                } else if (cmd === '/pm') {
                    const username = parts[1];
                    const msg = parts.slice(2).join(' ');
                    if (!username || !msg) {
                        consola.warn('Usage: /pm <username> <message>');
                    } else {
                        this.mineflayer.execute(`/msg ${username} ${msg}`);
                        consola.info(`[PM to ${username}] ${msg}`);
                    }
                } else if (cmd === '/cmd') {
                    const command = parts.slice(1).join(' ');
                    if (!command) {
                        consola.warn('Usage: /cmd <command>');
                    } else {
                        if (this.mineflayer.bot) {
                            this.mineflayer.bot.chat(command);
                            consola.info(`[CMD] ${command}`);
                        } else {
                            consola.error('Mineflayer bot not connected');
                        }
                    }
                } else if (cmd.startsWith('!')) {
                    // Extension command - simulate a guild chat message to trigger extensions
                    const fakeMessage = `Guild > [OWNER] TerminalUser [GM]: ${input}`;
                    consola.info(`[Extension Command] ${input}`);

                    // Process through extension manager
                    await this.extensionManager.processChatMessage(fakeMessage);
                } else {
                    consola.warn(
                        `Unknown command: ${cmd}. Type 'help' for available commands or use ! for extension commands.`
                    );
                }
            } catch (err) {
                consola.error('Terminal command error:', err);
            } finally {
                rl.prompt();
            }
        });

        rl.on('close', () => {
            consola.info('Terminal REPL closed');
        });
    }

    public async shutdown() {
        consola.info('Shutting down bridge...');

        try {
            // Disable all extensions
            const extensionList = this.extensionManager.getExtensionStats().list;
            for (const extension of extensionList) {
                if (extension.enabled) {
                    await this.extensionManager.disableExtension(extension.id);
                }
            }

            this.discord.destroy();
            // Add any other cleanup needed
        } catch (error) {
            consola.error('Error during shutdown:', error);
        }
    }
}

const handleError = (e: Error) => consola.error(e);
const handleShutdown = async (bridge: Bridge) => {
    await bridge.shutdown();
    process.exit(0);
};

// Handle graceful shutdown
process.on('SIGINT', () => handleShutdown(new Bridge()));
process.on('SIGTERM', () => handleShutdown(new Bridge()));
process.on('uncaughtException', handleError).on('unhandledRejection', handleError);
