/**
 * Mineflayer Extension Template Generator
 * 
 * Generates extension templates specifically for Mineflayer bots
 */

import path from 'path';
import fs from 'fs/promises';
import { consola } from 'consola';

export interface ExtensionTemplateOptions {
    name: string;
    id: string;
    author?: string;
    description?: string;
    version?: string;
    features?: ('chatPatterns' | 'commands' | 'events' | 'config')[];
}

export class MineflayerExtensionTemplateGenerator {
    /**
     * Generate a new extension from template
     */
    async generateExtension(outputDir: string, options: ExtensionTemplateOptions): Promise<boolean> {
        try {
            const extensionDir = path.join(outputDir, options.id);
            
            // Create extension directory
            await fs.mkdir(extensionDir, { recursive: true });
            
            // Generate package.json
            await this.generatePackageJson(extensionDir, options);
            
            // Generate main extension file
            await this.generateMainFile(extensionDir, options);
            
            // Generate README
            await this.generateReadme(extensionDir, options);
            
            // Generate feature-specific files
            if (options.features?.includes('chatPatterns')) {
                await this.generateChatPatternsExample(extensionDir, options);
            }
            
            if (options.features?.includes('commands')) {
                await this.generateCommandsExample(extensionDir, options);
            }
            
            if (options.features?.includes('config')) {
                await this.generateConfigExample(extensionDir, options);
            }
            
            consola.success(`Extension template generated at: ${extensionDir}`);
            return true;
            
        } catch (error) {
            consola.error('Error generating extension template:', error);
            return false;
        }
    }

    /**
     * Generate package.json
     */
    private async generatePackageJson(extensionDir: string, options: ExtensionTemplateOptions): Promise<void> {
        const packageJson = {
            name: options.id,
            version: options.version || '1.0.0',
            description: options.description || `A Mineflayer extension: ${options.name}`,
            main: 'index.ts',
            author: options.author || 'Unknown',
            license: 'MIT',
            extension: {
                id: options.id,
                name: options.name,
                description: options.description || `A Mineflayer extension: ${options.name}`,
                dependencies: [],
                chatPatterns: options.features?.includes('chatPatterns') ? ['patterns'] : undefined,
                commands: options.features?.includes('commands') ? ['commands'] : undefined,
                events: options.features?.includes('events') ? ['events'] : undefined,
                configSchema: options.features?.includes('config') ? {
                    type: 'object',
                    properties: {
                        enabled: {
                            type: 'boolean',
                            default: true,
                            description: 'Whether the extension is enabled'
                        }
                    }
                } : undefined
            },
            scripts: {
                build: 'tsc',
                dev: 'tsc --watch'
            },
            devDependencies: {
                typescript: '^5.0.0',
                '@types/node': '^20.0.0'
            }
        };

        await fs.writeFile(
            path.join(extensionDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );
    }

    /**
     * Generate main extension file
     */
    private async generateMainFile(extensionDir: string, options: ExtensionTemplateOptions): Promise<void> {
        const template = `/**
 * ${options.name} Extension
 * 
 * ${options.description || `A Mineflayer extension: ${options.name}`}
 * 
 * @author ${options.author || 'Unknown'}
 * @version ${options.version || '1.0.0'}
 */

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
    log: any;
    events: any;
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

class ${options.name.replace(/[^a-zA-Z0-9]/g, '')}Extension {
    readonly manifest = {
        id: '${options.id}',
        name: '${options.name}',
        version: '${options.version || '1.0.0'}',
        description: '${options.description || `A Mineflayer extension: ${options.name}`}',
        author: '${options.author || 'Unknown'}'
    };

    private config: any = {};

    async init(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(\`Initializing \${this.manifest.name}...\`);
        
        // Get configuration
        this.config = api.config || {};
        
        // Extension initialization logic here
        
        api.log.success(\`\${this.manifest.name} initialized successfully\`);
    }

    async destroy(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(\`Destroying \${this.manifest.name}...\`);
        // Cleanup logic here
    }

    async onEnable(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(\`\${this.manifest.name} enabled\`);
        
        // Register any additional event listeners here
    }

    async onDisable(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(\`\${this.manifest.name} disabled\`);
        // Remove event listeners here
    }

    async onConfigChange(newConfig: any, oldConfig: any, api: ExtensionAPI): Promise<void> {
        api.log.info(\`\${this.manifest.name} configuration updated\`);
        this.config = newConfig;
        // Handle configuration changes
    }

    async healthCheck(api: ExtensionAPI): Promise<boolean> {
        // Implement health check logic
        return this.config.enabled !== false;
    }

${options.features?.includes('chatPatterns') ? `
    /**
     * Define chat patterns that this extension handles
     */
    getChatPatterns(): ChatPattern[] {
        return [
            {
                id: '${options.id}-example',
                extensionId: '${options.id}',
                pattern: /^!${options.id.toLowerCase()}(?:\\s+(.*))?$/i,
                priority: 10,
                description: 'Example command pattern',
                handler: this.handleExampleCommand.bind(this)
            }
        ];
    }

    /**
     * Handle example command
     */
    private async handleExampleCommand(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        const args = context.matches?.[1]?.trim().split(' ') || [];
        
        api.log.info(\`Example command triggered by \${context.username} with args: \${args.join(', ')}\`);
        
        // Example response
        if (context.channel === 'Guild' || context.channel === 'Officer') {
            api.chat.sendGuildChat(\`Hello \${context.username}! Extension \${this.manifest.name} is working!\`);
        } else if (context.channel === 'Private') {
            api.chat.sendPrivateMessage(context.username, \`Hello! Extension \${this.manifest.name} is working!\`);
        }
        
        // Send Discord notification if configured
        if (this.config.discordChannelId) {
            await api.discord.sendMessage(this.config.discordChannelId, {
                content: \`\${this.manifest.name} command used by \${context.username}\`
            });
        }
    }
` : ''}
}

export default ${options.name.replace(/[^a-zA-Z0-9]/g, '')}Extension;
`;

        await fs.writeFile(path.join(extensionDir, 'index.ts'), template);
    }

    /**
     * Generate README.md
     */
    private async generateReadme(extensionDir: string, options: ExtensionTemplateOptions): Promise<void> {
        const readme = `# ${options.name}

${options.description || `A Mineflayer extension: ${options.name}`}

## Installation

1. Copy this extension to your \`extensions/${options.id}\` directory
2. Install dependencies: \`npm install\`
3. Build (if TypeScript): \`npm run build\`
4. Enable in your bot configuration

## Configuration

\`\`\`json
{
  "${options.id}": {
    "enabled": true,
    "discordChannelId": "your-discord-channel-id"
  }
}
\`\`\`

## Features

${options.features?.includes('chatPatterns') ? '- ✅ Chat pattern handling\n' : ''}${options.features?.includes('commands') ? '- ✅ Discord commands\n' : ''}${options.features?.includes('events') ? '- ✅ Event handling\n' : ''}${options.features?.includes('config') ? '- ✅ Configuration management\n' : ''}

## Usage

${options.features?.includes('chatPatterns') ? `
### Chat Commands

- \`!${options.id.toLowerCase()}\` - Example command

` : ''}

## Development

- \`npm run build\` - Build TypeScript
- \`npm run dev\` - Watch mode for development

## Author

${options.author || 'Unknown'}

## Version

${options.version || '1.0.0'}
`;

        await fs.writeFile(path.join(extensionDir, 'README.md'), readme);
    }

    /**
     * Generate chat patterns example
     */
    private async generateChatPatternsExample(extensionDir: string, options: ExtensionTemplateOptions): Promise<void> {
        const patternsDir = path.join(extensionDir, 'patterns');
        await fs.mkdir(patternsDir, { recursive: true });

        const examplePattern = `/**
 * Example chat patterns for ${options.name}
 */

export const chatPatterns = {
    // Example: Match "!help" command
    helpCommand: /^!help(?:\\s+(.*))?$/i,
    
    // Example: Match "!${options.id.toLowerCase()}" command
    mainCommand: /^!${options.id.toLowerCase()}(?:\\s+(.*))?$/i,
    
    // Example: Match mentions of the extension
    mention: new RegExp(\`${options.name.toLowerCase()}\`, 'i'),
    
    // Example: Match specific keywords
    keywords: /\\b(stats|info|help|status)\\b/i
};

export default chatPatterns;
`;

        await fs.writeFile(path.join(patternsDir, 'index.ts'), examplePattern);
    }

    /**
     * Generate commands example
     */
    private async generateCommandsExample(extensionDir: string, options: ExtensionTemplateOptions): Promise<void> {
        const commandsDir = path.join(extensionDir, 'commands');
        await fs.mkdir(commandsDir, { recursive: true });

        const exampleCommand = `/**
 * Example Discord command for ${options.name}
 */

import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('${options.id.toLowerCase()}')
        .setDescription('${options.description || `Interact with ${options.name} extension`}')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action to perform')
                .setRequired(false)
        ),
    
    async execute(interaction: any, context: any) {
        const action = interaction.options.getString('action') || 'status';
        
        switch (action.toLowerCase()) {
            case 'status':
                await interaction.reply({
                    content: \`\${context.manifest.name} v\${context.manifest.version} is running!\`,
                    ephemeral: true
                });
                break;
                
            case 'help':
                await interaction.reply({
                    embeds: [{
                        title: context.manifest.name,
                        description: context.manifest.description,
                        fields: [
                            {
                                name: 'Version',
                                value: context.manifest.version,
                                inline: true
                            },
                            {
                                name: 'Author',
                                value: context.manifest.author || 'Unknown',
                                inline: true
                            }
                        ]
                    }],
                    ephemeral: true
                });
                break;
                
            default:
                await interaction.reply({
                    content: \`Unknown action: \${action}\`,
                    ephemeral: true
                });
        }
    }
};
`;

        await fs.writeFile(path.join(commandsDir, `${options.id}.ts`), exampleCommand);
    }

    /**
     * Generate config example
     */
    private async generateConfigExample(extensionDir: string, options: ExtensionTemplateOptions): Promise<void> {
        const configExample = `/**
 * Configuration example for ${options.name}
 */

export const defaultConfig = {
    enabled: true,
    debug: false,
    
    // Discord integration
    discordChannelId: '',
    sendNotifications: true,
    
    // Extension-specific settings
    autoRespond: false,
    responseDelay: 1000,
    
    // Feature toggles
    features: {
        chatPatterns: true,
        commands: true,
        events: true
    }
};

export const configSchema = {
    type: 'object',
    properties: {
        enabled: {
            type: 'boolean',
            default: true,
            description: 'Whether the extension is enabled'
        },
        debug: {
            type: 'boolean',
            default: false,
            description: 'Enable debug logging'
        },
        discordChannelId: {
            type: 'string',
            description: 'Discord channel ID for notifications'
        },
        sendNotifications: {
            type: 'boolean',
            default: true,
            description: 'Send Discord notifications'
        },
        autoRespond: {
            type: 'boolean',
            default: false,
            description: 'Automatically respond to certain messages'
        },
        responseDelay: {
            type: 'number',
            default: 1000,
            minimum: 0,
            maximum: 10000,
            description: 'Delay before responding (milliseconds)'
        }
    }
};

export default { defaultConfig, configSchema };
`;

        await fs.writeFile(path.join(extensionDir, 'config.ts'), configExample);
    }
}

export default MineflayerExtensionTemplateGenerator;
