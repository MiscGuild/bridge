import { ActivityType, IntentsBitField } from 'discord.js';
import { consola } from 'consola';
import env from '@util/env';
import Discord from '@discord/discord';
import Mineflayer from '@mineflayer/mineflayer';
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
        await Promise.all([
            this.discord.loadCommands(),
            this.discord.loadEvents(this),
        ]);

        // Load and enable extensions
        consola.info('Loading Mineflayer extensions...');
        this.extensionManager.addExtensionDirectory('./extensions');
        await this.extensionManager.loadExtensions();
        await this.extensionManager.enableAllExtensions();
        
        // Log extension stats
        const stats = this.extensionManager.getExtensionStats();
        consola.info(`Extensions: ${stats.enabled}/${stats.total} enabled, ${stats.chatPatterns} patterns registered`);
        
        // Then load Mineflayer events (which need extensions to be loaded)
        await this.mineflayer.loadEvents(this);

        await this.discord.login(env.DISCORD_TOKEN);
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