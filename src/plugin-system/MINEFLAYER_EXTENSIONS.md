# Mineflayer Extension System

A powerful extension system specifically designed for Mineflayer bots that focuses on chat pattern matching and routing. This system allows you to easily add new functionality to your Minecraft bot through modular extensions.

## Features

- 🔌 **Chat Pattern Routing**: Central chat message prrocessing with patten-based routing
- 🎯 **Priority System**: Extensions can define priority for pattern matching
- 🔄 **Hot Reloading**: Reload extensions without restarting your bot
- 📦 **Dependency Management**: Automatic resolution of extension dependencies
- ⚙️ **Configuration Management**: Schema-based configuration with validation
- 🏥 **Health Monitoring**: Built-in health checks for extensions
- 🎨 **Template Generator**: CLI tool for generating extension templates
- 📋 **Extension CLI**: Comprehensive command-line interface
- 🤖 **Discord Integration**: Built-in Discord webhook/message support

## How It Works

The extension system works by:

1. **Central Chat Listener**: A master chat pattern that catches all chat messages
2. **Message Parsing**: Automatically parses guild chat, party chat, and private messages
3. **Pattern Matching**: Routes messages to appropriate extensions based on regex patterns
4. **Priority Handling**: Extensions with higher priority (lower numbers) are checked first
5. **Response Handling**: Extensions can respond via chat, Discord, or custom actions

## Quick Start

### 1. Basic Setup

```typescript
import Bridge from './bridge';
import MineflayerExtensionManager from './plugin-system/mineflayer-extension-manager';

// Create your bridge instance
const bridge = new Bridge();

// Create extension manager
const extensionManager = new MineflayerExtensionManager(bridge);

// Load extensions
await extensionManager.loadExtensions();

// Enable all extensions
await extensionManager.enableAllExtensions();

// Check stats
const stats = extensionManager.getExtensionStats();
console.log(`Loaded ${stats.enabled}/${stats.total} extensions`);
```

### 2. Creating Extensions

#### Using the CLI (Recommended)

```bash
# Install the CLI
npm install -g ./src/plugin-system

# Create a new extension
mineflayer-extensions create "Stats Checker" \
    --id stats-checker \
    --author "Your Name" \
    --description "Check player statistics" \
    --features chatPatterns,commands,config

# Navigate to the extension
cd extensions/stats-checker

# Install dependencies
npm install

# Build the extension
npm run build
```

#### Manual Creation

Create an extension directory structure:

```
extensions/
└── stats-checker/
    ├── package.json          # Extension manifest
    ├── index.ts             # Main extension file
    ├── README.md           # Documentation
    └── config.ts           # Configuration (optional)
```

**package.json:**
```json
{
  "name": "stats-checker",
  "version": "1.0.0",
  "description": "Check player statistics",
  "main": "index.ts",
  "author": "Your Name",
  "extension": {
    "id": "stats-checker",
    "name": "Stats Checker",
    "description": "Check player statistics",
    "dependencies": []
  }
}
```

**index.ts:**
```typescript
interface ChatMessageContext {
    message: string;
    username: string;
    channel?: 'Guild' | 'Officer' | 'Party' | 'Private' | string;
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

class StatsCheckerExtension {
    readonly manifest = {
        id: 'stats-checker',
        name: 'Stats Checker',
        version: '1.0.0',
        description: 'Check player statistics',
        author: 'Your Name'
    };

    async init(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(`Initializing ${this.manifest.name}...`);
        api.log.success(`${this.manifest.name} initialized successfully`);
    }

    async onEnable(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(`${this.manifest.name} enabled`);
    }

    async onDisable(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(`${this.manifest.name} disabled`);
    }

    /**
     * Define chat patterns that this extension handles
     */
    getChatPatterns(): ChatPattern[] {
        return [
            {
                id: 'stats-check-command',
                extensionId: 'stats-checker',
                pattern: /^!(stats|st)(?:\s+([A-Za-z0-9_]+))?$/i,
                priority: 10,
                description: 'Check player statistics',
                handler: this.handleStatsCommand.bind(this)
            },
            {
                id: 'bedwars-stats',
                extensionId: 'stats-checker',
                pattern: /^!(bw|bedwars)(?:\s+([A-Za-z0-9_]+))?$/i,
                priority: 15,
                description: 'Check Bedwars statistics',
                handler: this.handleBedwarsStats.bind(this)
            }
        ];
    }

    /**
     * Handle stats command
     */
    private async handleStatsCommand(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        const targetPlayer = context.matches?.[2] || context.username;
        
        api.log.info(`Stats requested for ${targetPlayer} by ${context.username}`);
        
        try {
            // Your stats fetching logic here
            const statsMessage = `${targetPlayer}'s stats: Coming soon!`;
            
            if (context.channel === 'Guild' || context.channel === 'Officer') {
                api.chat.sendGuildChat(statsMessage);
            } else if (context.channel === 'Private') {
                api.chat.sendPrivateMessage(context.username, statsMessage);
            }
            
        } catch (error) {
            api.log.error('Error fetching stats:', error);
            
            const errorMessage = `Sorry ${context.username}, couldn't fetch stats for ${targetPlayer}`;
            
            if (context.channel === 'Guild' || context.channel === 'Officer') {
                api.chat.sendGuildChat(errorMessage);
            } else if (context.channel === 'Private') {
                api.chat.sendPrivateMessage(context.username, errorMessage);
            }
        }
    }

    /**
     * Handle Bedwars stats command
     */
    private async handleBedwarsStats(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        const targetPlayer = context.matches?.[2] || context.username;
        
        // Your Bedwars stats logic here
        const statsMessage = `${targetPlayer}'s Bedwars stats: Coming soon!`;
        
        if (context.channel === 'Guild' || context.channel === 'Officer') {
            api.chat.sendGuildChat(statsMessage);
        } else if (context.channel === 'Private') {
            api.chat.sendPrivateMessage(context.username, statsMessage);
        }
    }

    async healthCheck(api: ExtensionAPI): Promise<boolean> {
        return true; // Extension is healthy
    }
}

export default StatsCheckerExtension;
```

## Chat Pattern System

### Message Parsing

The system automatically parses different types of chat messages:

```typescript
// Guild chat: "Guild > [MVP+] PlayerName [GUILDMASTER]: !stats"
{
    message: "!stats",
    username: "PlayerName", 
    channel: "Guild",
    rank: "[MVP+]",
    guildRank: "[GUILDMASTER]",
    timestamp: Date,
    raw: "Guild > [MVP+] PlayerName [GUILDMASTER]: !stats"
}

// Private message: "From [VIP] PlayerName: !help"
{
    message: "!help",
    username: "PlayerName",
    channel: "Private", 
    rank: "[VIP]",
    timestamp: Date,
    raw: "From [VIP] PlayerName: !help"
}
```

### Pattern Priority

Extensions can define multiple patterns with different priorities:

```typescript
getChatPatterns(): ChatPattern[] {
    return [
        {
            id: 'urgent-command',
            extensionId: 'my-extension',
            pattern: /^!emergency$/i,
            priority: 1, // Highest priority
            handler: this.handleEmergency.bind(this)
        },
        {
            id: 'normal-command', 
            extensionId: 'my-extension',
            pattern: /^!help$/i,
            priority: 10, // Lower priority
            handler: this.handleHelp.bind(this)
        },
        {
            id: 'catch-all',
            extensionId: 'my-extension', 
            pattern: /^!.*/i,
            priority: 100, // Lowest priority (fallback)
            handler: this.handleUnknown.bind(this)
        }
    ];
}
```

## Extension Features

### Configuration Management

```typescript
// config.ts
export const configSchema = {
    type: 'object',
    properties: {
        enabled: {
            type: 'boolean',
            default: true
        },
        apiKey: {
            type: 'string',
            description: 'API key for external service'
        },
        discordChannelId: {
            type: 'string',
            description: 'Discord channel for notifications'
        }
    },
    required: ['apiKey']
};

// In your extension
async onConfigChange(newConfig: any, oldConfig: any, api: ExtensionAPI): Promise<void> {
    api.log.info('Configuration updated:', newConfig);
    // Handle config changes
}
```

### Discord Integration

```typescript
// Send Discord message
await api.discord.sendMessage('channel-id', 'Hello Discord!');

// Send Discord embed
await api.discord.sendEmbed('channel-id', {
    title: 'Stats Update',
    description: 'Player stats have been updated',
    color: 0x00ff00,
    fields: [
        { name: 'Player', value: 'PlayerName', inline: true },
        { name: 'Level', value: '42', inline: true }
    ]
});
```

### Health Checks

```typescript
async healthCheck(api: ExtensionAPI): Promise<boolean> {
    try {
        // Check if external API is accessible
        const response = await fetch('https://api.example.com/health');
        return response.ok;
    } catch (error) {
        api.log.error('Health check failed:', error);
        return false;
    }
}
```

## CLI Usage

The extension system includes a CLI for managing extensions:

```bash
# Create a new extension
mineflayer-extensions create "My Extension" --features chatPatterns,commands

# List all extensions
mineflayer-extensions list --directory ./extensions

# Validate an extension
mineflayer-extensions validate ./extensions/my-extension

# Get extension info
mineflayer-extensions info ./extensions/my-extension --json
```

## Integration with Bridge

Update your bridge to use the extension system:

```typescript
// src/bridge.ts
import MineflayerExtensionManager from './plugin-system/mineflayer-extension-manager';

export default class Bridge {
    public readonly extensionManager: MineflayerExtensionManager;
    
    constructor() {
        // ... existing code ...
        
        // Initialize extension manager
        this.extensionManager = new MineflayerExtensionManager(this);
    }
    
    private async start() {
        // ... existing code ...
        
        // Load and enable extensions
        await this.extensionManager.loadExtensions();
        await this.extensionManager.enableAllExtensions();
        
        // Log extension stats
        const stats = this.extensionManager.getExtensionStats();
        winston.info(`Extensions: ${stats.enabled}/${stats.total} enabled, ${stats.chatPatterns} patterns registered`);
    }
    
    public async shutdown() {
        // ... existing code ...
        
        // Disable all extensions
        for (const extensionId of this.extensionManager.getExtensionStats().list.map(e => e.id)) {
            await this.extensionManager.disableExtension(extensionId);
        }
    }
}
```

## Example Extensions

### Guild Management Extension

```typescript
getChatPatterns(): ChatPattern[] {
    return [
        {
            id: 'promote-command',
            extensionId: 'guild-management',
            pattern: /^!promote\s+([A-Za-z0-9_]+)$/i,
            priority: 5,
            handler: async (context, api) => {
                const targetPlayer = context.matches![1];
                api.chat.sendGuildChat(`/g promote ${targetPlayer}`);
                await api.discord.sendMessage(api.config.logChannelId, 
                    `${context.username} promoted ${targetPlayer}`);
            }
        },
        {
            id: 'demote-command',
            extensionId: 'guild-management', 
            pattern: /^!demote\s+([A-Za-z0-9_]+)$/i,
            priority: 5,
            handler: async (context, api) => {
                const targetPlayer = context.matches![1];
                api.chat.sendGuildChat(`/g demote ${targetPlayer}`);
            }
        }
    ];
}
```

### Auto-Responder Extension

```typescript
getChatPatterns(): ChatPattern[] {
    return [
        {
            id: 'greeting-response',
            extensionId: 'auto-responder',
            pattern: /\b(hello|hi|hey)\b.*bot/i,
            priority: 50,
            handler: async (context, api) => {
                const responses = [
                    `Hello ${context.username}!`,
                    `Hi there ${context.username}!`,
                    `Hey ${context.username}, how can I help?`
                ];
                
                const response = responses[Math.floor(Math.random() * responses.length)];
                
                setTimeout(() => {
                    if (context.channel === 'Guild') {
                        api.chat.sendGuildChat(response);
                    }
                }, 1000); // 1 second delay
            }
        }
    ];
}
```

## Best Practices

1. **Pattern Specificity**: Make patterns as specific as possible to avoid conflicts
2. **Priority Management**: Use appropriate priorities (1-10 for urgent, 10-50 for normal, 50+ for fallback)
3. **Error Handling**: Always wrap handlers in try-catch blocks
4. **Response Delays**: Add delays to avoid chat spam
5. **Resource Cleanup**: Properly clean up in `onDisable()` and `destroy()` methods
6. **Configuration**: Use schema validation for extension configurations
7. **Logging**: Use the provided logger for consistent log formatting
8. **Testing**: Test patterns thoroughly with various message formats

## Troubleshooting

### Common Issues

1. **Pattern Not Matching**: Check regex syntax and test with actual chat messages
2. **Extension Not Loading**: Verify package.json structure and main file exists
3. **Priority Conflicts**: Ensure patterns have appropriate priorities
4. **Chat Spam**: Add delays between responses and rate limiting
5. **Memory Leaks**: Properly clean up event listeners and timers

### Debug Mode

Enable debug logging to see pattern matching in action:

```typescript
// In your extension
async init(context: any, api: ExtensionAPI): Promise<void> {
    if (api.config.debug) {
        api.events.on('chatMessage', (context) => {
            api.log.debug(`Processing message: ${context.message} from ${context.username}`);
        });
    }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your extension or improvements
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
