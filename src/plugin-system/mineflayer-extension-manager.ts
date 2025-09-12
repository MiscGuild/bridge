/**
 * Mineflayer Extension Manager
 * 
 * A specialized extension system for Mineflayer bots focused on chat pattern routing
 */

import path from 'path';
import fs from 'fs/promises';
import { consola } from 'consola';
import { EventEmitter } from 'events';
import recursiveWalkDir from '@util/recursive-walk-dir';
import Bridge from '@bridge';

// Core interfaces for Mineflayer extensions
interface ChatMessageContext {
    message: string;
    username: string;
    channel?: 'Guild' | 'Officer' | 'Party' | 'Private' | string;
    rank?: string;
    guildRank?: string;
    timestamp: Date;
    raw: string;
    matches?: RegExpMatchArray;
}

interface ExtensionAPI {
    log: typeof consola;
    events: EventEmitter;
    config: any;
    chat: {
        sendGuildChat: (message: string) => void;
        sendPrivateMessage: (username: string, message: string) => void;
        sendPartyMessage: (message: string) => void;
    };
    discord: {
        sendMessage: (channelId: string, content: any) => Promise<any>;
        sendEmbed: (channelId: string, embed: any) => Promise<any>;
    };
    utils: Record<string, any>;
}

interface ChatPattern {
    id: string;
    extensionId: string;
    pattern: RegExp;
    priority: number;
    description?: string;
    handler: (context: ChatMessageContext, api: ExtensionAPI) => Promise<void> | void;
}

interface ExtensionManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author?: string;
    dependencies?: string[];
    main?: string;
    enabled?: boolean;
    chatPatterns?: string[];
    commands?: string[];
    events?: string[];
    configSchema?: any;
}

interface MineflayerExtension {
    manifest: ExtensionManifest;
    init?(context: any, api: ExtensionAPI): Promise<void> | void;
    destroy?(context: any, api: ExtensionAPI): Promise<void> | void;
    onEnable?(context: any, api: ExtensionAPI): Promise<void> | void;
    onDisable?(context: any, api: ExtensionAPI): Promise<void> | void;
    onConfigChange?(newConfig: any, oldConfig: any, api: ExtensionAPI): Promise<void> | void;
    healthCheck?(api: ExtensionAPI): Promise<boolean> | boolean;
    getChatPatterns?(): ChatPattern[];
}

interface ExtensionLoadResult {
    success: boolean;
    extension?: MineflayerExtension;
    error?: Error;
    warnings?: string[];
}

export class MineflayerExtensionManager extends EventEmitter {
    private extensions: Map<string, MineflayerExtension> = new Map();
    private enabledExtensions: Set<string> = new Set();
    private chatPatterns: Map<string, ChatPattern> = new Map();
    private extensionDirectories: Set<string> = new Set();
    private extensionConfigs: Map<string, any> = new Map();
    private context: any;
    private extensionAPI: ExtensionAPI;
    private masterChatPattern: RegExp = /.*/;
    private isListeningToChat: boolean = false;
    private processedMessages: Set<string> = new Set();

    constructor(bridge: Bridge) {
        super();
        
        // Set up message cleanup interval to prevent memory leaks
        setInterval(() => {
            this.processedMessages.clear();
        }, 60000); // Clear every minute
        
        this.context = {
            bridge,
            bot: bridge.mineflayer.getBot(),
            discord: bridge.discord
        };

        this.extensionAPI = {
            log: consola,
            events: this,
            config: {},
            chat: {
                sendGuildChat: (message: string) => {
                    bridge.mineflayer.getBot().chat(`/gc ${message}`);
                },
                sendPrivateMessage: (username: string, message: string) => {
                    bridge.mineflayer.getBot().chat(`/msg ${username} ${message}`);
                },
                sendPartyMessage: (message: string) => {
                    bridge.mineflayer.getBot().chat(`/pc ${message}`);
                }
            },
            discord: {
                sendMessage: async (channelId: string, content: any) => {
                    const channel = bridge.discord.channels.cache.get(channelId);
                    if (channel && 'send' in channel) {
                        return await channel.send(content);
                    }
                    return null;
                },
                sendEmbed: async (channelId: string, embed: any) => {
                    const channel = bridge.discord.channels.cache.get(channelId);
                    if (channel && 'send' in channel) {
                        return await channel.send({ embeds: [embed] });
                    }
                    return null;
                }
            },
            utils: {}
        };
        
        this.extensionDirectories.add(path.join(process.cwd(), 'plugins'));
        this.extensionDirectories.add(path.join(process.cwd(), 'extensions'));
        
        this.setupCentralChatListener();
    }

    /**
     * Set up the central chat listener that processes all messages
     */
    private setupCentralChatListener(): void {
        if (this.isListeningToChat) return;
        
        const bot = this.context.bot;
        
        // Check if addChatPattern method exists (it's added by the bot's pattern system)
        if (typeof (bot as any).addChatPattern === 'function') {
            // Use the existing chat pattern system
            (bot as any).addChatPattern('extension_router', this.masterChatPattern, {
                repeat: true,
                parse: true
            });
            
            bot.on('chat:extension_router', async (matches: RegExpMatchArray) => {
                await this.processChatMessage(matches[0] || '');
            });
        } else {
            // Fallback to standard message event
            bot.on('message', async (jsonMsg: any, position: string) => {
                try {
                    // Convert message to string
                    const messageStr = typeof jsonMsg === 'string' ? jsonMsg : (jsonMsg?.toString ? jsonMsg.toString() : '');
                    
                    // Process the message through our extension system
                    await this.processChatMessage(messageStr);
                    
                } catch (error) {
                    this.extensionAPI.log.error('Error processing message through extensions:', error);
                }
            });
        }
        
        this.isListeningToChat = true;
        consola.debug('Central chat listener initialized');
    }

    /**
     * Process incoming chat message and route to appropriate extensions
     */
    public async processChatMessage(rawMessage: string): Promise<void> {
        // Create a unique message hash to prevent duplicate processing
        const messageHash = `${Date.now()}-${rawMessage}`;
        
        // Check if we've already processed this exact message recently
        if (this.processedMessages.has(messageHash)) {
            return;
        }
        
        // Add to processed messages to prevent duplicates
        this.processedMessages.add(messageHash);
        
        const messageContext = this.parseChatMessage(rawMessage);
        if (!messageContext) return;

        const patterns = Array.from(this.chatPatterns.values())
            .filter(p => this.enabledExtensions.has(p.extensionId))
            .sort((a, b) => a.priority - b.priority);

        for (const pattern of patterns) {
            const matches = messageContext.message.match(pattern.pattern);
            if (matches) {
                try {
                    messageContext.matches = matches;
                    await pattern.handler(messageContext, this.extensionAPI);
                    break; // Stop after first match
                } catch (error) {
                    consola.error(`Error in chat pattern handler ${pattern.id}:`, error);
                    this.emit('extensionError', pattern.extensionId, error);
                }
            }
        }
    }

    /**
     * Parse raw chat message into structured context
     */
    private parseChatMessage(rawMessage: string): ChatMessageContext | null {
        const guildChatPattern = /^(Guild|Officer) > (?:\[.*?\])?\s*([A-Za-z0-9_-]{2,17})\s*(?:\[.*?\])?:\s*(.*)$/;
        const partyPattern = /^Party > (?:\[.*?\])?\s*([A-Za-z0-9_-]{2,17})\s*(?:\[.*?\])?:\s*(.*)$/;
        const privatePattern = /^From (?:\[.*?\])?\s*([A-Za-z0-9_-]{2,17})\s*(?:\[.*?\])?: (.*)$/;

        let match: RegExpMatchArray | null;
        
        if ((match = rawMessage.match(guildChatPattern))) {
            return {
                message: match[3] || '',
                username: match[2] || '',
                channel: match[1] as 'Guild' | 'Officer',
                timestamp: new Date(),
                raw: rawMessage
            };
        }
        
        if ((match = rawMessage.match(partyPattern))) {
            return {
                message: match[2] || '',
                username: match[1] || '',
                channel: 'Party',
                timestamp: new Date(),
                raw: rawMessage
            };
        }
        
        if ((match = rawMessage.match(privatePattern))) {
            return {
                message: match[2] || '',
                username: match[1] || '',
                channel: 'Private',
                timestamp: new Date(),
                raw: rawMessage
            };
        }

        return {
            message: rawMessage,
            username: 'Unknown',
            channel: 'Unknown',
            timestamp: new Date(),
            raw: rawMessage
        };
    }

    /**
     * Load all extensions
     */
    async loadExtensions(): Promise<Map<string, ExtensionLoadResult>> {
        const results = new Map<string, ExtensionLoadResult>();
        
        for (const extensionsDir of this.extensionDirectories) {
            if (!(await this.pathExists(extensionsDir))) {
                consola.warn(`Extension directory does not exist: ${extensionsDir}`);
                continue;
            }
            
            const entries = await fs.readdir(extensionsDir, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const extensionPath = path.join(extensionsDir, entry.name);
                    const result = await this.loadExtension(extensionPath);
                    results.set(entry.name, result);
                }
            }
        }
        
        consola.info(`Loaded ${this.extensions.size} extensions`);
        return results;
    }

    /**
     * Load a single extension
     */
    async loadExtension(extensionDir: string): Promise<ExtensionLoadResult> {
        const result: ExtensionLoadResult = { success: false, warnings: [] };
        
        try {
            const manifest = await this.loadExtensionManifest(extensionDir);
            if (!manifest) {
                throw new Error('No valid manifest found');
            }
            
            const mainFile = manifest.main || 'index.ts';
            
            // Check for compiled version first (dist/index.js), then source (index.ts)
            let mainPath = path.join(extensionDir, 'dist', mainFile.replace(/\.ts$/, '.js'));
            if (!(await this.pathExists(mainPath))) {
                mainPath = path.join(extensionDir, mainFile);
            }
            
            if (!(await this.pathExists(mainPath))) {
                throw new Error(`Main file not found: ${mainFile} (checked both compiled and source versions)`);
            }
            
            delete require.cache[require.resolve(mainPath)];
            const ExtensionClass = (await import(mainPath)).default;
            
            // Instantiate the extension class
            const extensionInstance = new ExtensionClass();
            
            consola.debug(`Extension instance created for ${manifest.id}`);
            consola.debug(`Extension has getChatPatterns method: ${typeof extensionInstance.getChatPatterns === 'function'}`);
            
            const extension: MineflayerExtension = extensionInstance;
            extension.manifest = manifest;
            
            this.extensions.set(manifest.id, extension);
            
            result.success = true;
            result.extension = extension;
            
            consola.debug(`Loaded extension: ${manifest.name} v${manifest.version}`);
            
        } catch (error) {
            result.error = error instanceof Error ? error : new Error(String(error));
            consola.error(`Error loading extension at ${extensionDir}:`, result.error);
        }
        
        return result;
    }

    /**
     * Load extension manifest
     */
    private async loadExtensionManifest(extensionDir: string): Promise<ExtensionManifest | null> {
        const possibleFiles = ['extension.json', 'package.json'];
        
        for (const fileName of possibleFiles) {
            const filePath = path.join(extensionDir, fileName);
            
            if (await this.pathExists(filePath)) {
                try {
                    const content = JSON.parse(await fs.readFile(filePath, 'utf8'));
                    
                    if (fileName === 'package.json') {
                        return {
                            id: content.extension?.id || content.name,
                            name: content.extension?.name || content.name,
                            version: content.version,
                            description: content.description || '',
                            author: content.author,
                            dependencies: content.extension?.dependencies || [],
                            main: content.main,
                            ...content.extension
                        };
                    } else {
                        return {
                            id: path.basename(extensionDir),
                            name: path.basename(extensionDir),
                            version: '1.0.0',
                            description: '',
                            ...content
                        };
                    }
                } catch (error) {
                    consola.warn(`Failed to parse ${fileName} in ${extensionDir}:`, error);
                }
            }
        }
        
        return null;
    }

    /**
     * Enable an extension
     */
    async enableExtension(extensionId: string): Promise<boolean> {
        const extension = this.extensions.get(extensionId);
        if (!extension) {
            consola.error(`Extension not found: ${extensionId}`);
            return false;
        }

        if (this.enabledExtensions.has(extensionId)) {
            consola.warn(`Extension ${extensionId} is already enabled`);
            return true;
        }

        try {
            const config = this.extensionConfigs.get(extensionId) || {};
            this.extensionAPI.config = config;

            if (extension.init) {
                await extension.init(this.context, this.extensionAPI);
            }

            // Register chat patterns
            if (extension.getChatPatterns) {
                const patterns = extension.getChatPatterns();
                consola.debug(`Extension ${extensionId} returned ${patterns.length} chat patterns`);
                for (const pattern of patterns) {
                    this.chatPatterns.set(pattern.id, pattern);
                    consola.debug(`Registered chat pattern: ${pattern.id}`);
                }
            } else {
                consola.debug(`Extension ${extensionId} has no getChatPatterns method`);
            }

            if (extension.onEnable) {
                await extension.onEnable(this.context, this.extensionAPI);
            }

            this.enabledExtensions.add(extensionId);
            consola.success(`Enabled extension: ${extension.manifest.name}`);
            return true;

        } catch (error) {
            consola.error(`Error enabling extension ${extensionId}:`, error);
            return false;
        }
    }

    /**
     * Disable an extension
     */
    async disableExtension(extensionId: string): Promise<boolean> {
        const extension = this.extensions.get(extensionId);
        if (!extension) {
            consola.error(`Extension not found: ${extensionId}`);
            return false;
        }

        if (!this.enabledExtensions.has(extensionId)) {
            consola.warn(`Extension ${extensionId} is not enabled`);
            return true;
        }

        try {
            if (extension.onDisable) {
                await extension.onDisable(this.context, this.extensionAPI);
            }

            // Remove chat patterns
            const patternsToRemove = Array.from(this.chatPatterns.keys())
                .filter(id => this.chatPatterns.get(id)?.extensionId === extensionId);
            
            for (const patternId of patternsToRemove) {
                this.chatPatterns.delete(patternId);
            }

            if (extension.destroy) {
                await extension.destroy(this.context, this.extensionAPI);
            }

            this.enabledExtensions.delete(extensionId);
            consola.success(`Disabled extension: ${extension.manifest.name}`);
            return true;

        } catch (error) {
            consola.error(`Error disabling extension ${extensionId}:`, error);
            return false;
        }
    }

    /**
     * Enable all extensions
     */
    async enableAllExtensions(): Promise<Map<string, boolean>> {
        const results = new Map<string, boolean>();
        
        for (const extensionId of this.extensions.keys()) {
            const success = await this.enableExtension(extensionId);
            results.set(extensionId, success);
        }
        
        return results;
    }

    /**
     * Register a chat pattern from an extension
     */
    registerChatPattern(pattern: ChatPattern): void {
        this.chatPatterns.set(pattern.id, pattern);
        consola.debug(`Registered chat pattern: ${pattern.id} for extension ${pattern.extensionId}`);
    }

    /**
     * Unregister a chat pattern
     */
    unregisterChatPattern(patternId: string): void {
        this.chatPatterns.delete(patternId);
        consola.debug(`Unregistered chat pattern: ${patternId}`);
    }

    /**
     * Get extension statistics
     */
    getExtensionStats() {
        const enabledExtensions = Array.from(this.enabledExtensions).map(id => this.extensions.get(id)!);
        
        return {
            total: this.extensions.size,
            enabled: this.enabledExtensions.size,
            disabled: this.extensions.size - this.enabledExtensions.size,
            chatPatterns: this.chatPatterns.size,
            list: enabledExtensions.map(ext => ({
                id: ext.manifest.id,
                name: ext.manifest.name,
                version: ext.manifest.version,
                author: ext.manifest.author,
                description: ext.manifest.description,
                enabled: true
            }))
        };
    }

    /**
     * Add extension directory
     */
    addExtensionDirectory(directory: string): void {
        this.extensionDirectories.add(path.resolve(directory));
    }

    /**
     * Get all chat patterns from enabled extensions
     */
    getAllChatPatterns(): ChatPattern[] {
        return Array.from(this.chatPatterns.values());
    }

    /**
     * Utility to check if path exists
     */
    private async pathExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

export default MineflayerExtensionManager;
