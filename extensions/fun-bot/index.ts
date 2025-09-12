/**
 * Fun Bot Extension
 * 
 * A playful extension that responds to various messages with funny and entertaining replies.
 * Includes responses to pings, greetings, mentions, and other fun interactions.
 * 
 * Configuration Options:
 * - responseDelay: Base delay in milliseconds before responding (default: 500)
 * - minDelay: Minimum response delay (default: 200)
 * - maxDelay: Maximum response delay (default: 2000)
 * - randomDelayVariation: Random variation factor 0-1 (default: 0.3 = ±30%)
 * - enabled: Enable/disable the extension (default: true)
 * 
 * @author MiscGuild Bridge Bot Team
 * @version 1.0.0
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

class FunBotExtension {
    readonly manifest = {
        id: 'fun-bot',
        name: 'Fun Bot',
        version: '1.0.0',
        description: 'A playful extension with entertaining responses to various messages',
        author: 'MiscGuild Bridge Bot Team'
    };

    private config: any = {};
    private lastPingTime: number = 0;
    private pingCount: number = 0;

    // Default configuration
    private defaultConfig = {
        responseDelay: 500, // milliseconds
        minDelay: 200,
        maxDelay: 2000,
        randomDelayVariation: 0.3, // 30% random variation
        enabled: false // ← This controls if it's enabled
    };

    // Fun response arrays
    private pingResponses = [
        'Pong! 🏓',
        'Pong! Why did you wake me up? 😴',
        'Pong! I\'m here, I\'m here! 🤖',
        'Pong! Latency: 0ms (I\'m just that good) ⚡',
        'Pong! *yawns* What do you need? 🥱',
        'Pong! Ready for action! 💪',
        'Pong! Beep boop! 🤖',
        'Pong! You rang? 📞'
    ];

    private greetingResponses = [
        'Hey there! 👋',
        'Hello! How can I help you today? 😊',
        'Hi! Nice to see you! ✨',
        'Greetings, human! 🤖',
        'Hey! What\'s up? 🚀',
        'Hello there! Ready for some fun? 🎉',
        'Hi! I was just thinking about you! 💭',
        'Hey! Perfect timing! 🎯'
    ];

    private botMentionResponses = [
        'You called? I\'m always listening! 👂',
        'MiscManager reporting for duty! 🫡',
        'That\'s me! What can I do for you? 😄',
        'Present! How may I assist? 🤝',
        'You rang? I\'m here! 📢',
        'MiscManager at your service! ⚡',
        'Yo! What\'s the plan? 🗺️',
        'I heard my name! What\'s happening? 🎪'
    ];

    private roastResponses = [
        'I may be a bot, but at least I don\'t rage quit Bedwars!',
        'Says the person talking to a robot...',
        'I\'m programmed to be awesome, what\'s your excuse?',
        'Beep boop, error 404: good comeback not found!',
        'I\'d roast you back, but I don\'t want to set off the fire alarms!',
        'That\'s rich coming from someone with a skill issue!'
    ];

    private complimentResponses = [
        'Aww, thank you! You\'re pretty great yourself!',
        'That made my circuits happy! ',
        'You\'re too kind! *blushes in binary*',
        'Thanks! I try my best to be helpful!',
        'That means a lot coming from you!',
        'You just made my day! Thank you!'
    ];

    async init(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(`Initializing ${this.manifest.name}...`);
        
        // Get configuration with defaults
        this.config = { ...this.defaultConfig, ...(api.config || {}) };
        
        // Check if extension is disabled
        if (this.config.enabled === false) {
            api.log.warn(`${this.manifest.name} is disabled in configuration`);
            return;
        }
        
        api.log.info(`Response delay configured: ${this.config.responseDelay}ms`);
        
        api.log.success(`${this.manifest.name} initialized successfully`);
    }

    async destroy(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(`Destroying ${this.manifest.name}...`);
    }

    async onEnable(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(`${this.manifest.name} enabled`);
    }

    async onDisable(context: any, api: ExtensionAPI): Promise<void> {
        api.log.info(`${this.manifest.name} disabled`);
    }

    async onConfigChange(newConfig: any, oldConfig: any, api: ExtensionAPI): Promise<void> {
        api.log.info(`${this.manifest.name} configuration updated`);
        this.config = { ...this.defaultConfig, ...newConfig };
        api.log.info(`Response delay updated: ${this.config.responseDelay}ms`);
    }

    async healthCheck(api: ExtensionAPI): Promise<boolean> {
        return this.config.enabled !== false;
    }

    /**
     * Define chat patterns that this extension handles
     */
    getChatPatterns(): ChatPattern[] {
        // Don't return patterns if extension is disabled
        if (this.config.enabled === false) {
            return [];
        }
        
        return [
            // Ping command
            {
                id: 'fun-ping',
                extensionId: 'fun-bot',
                pattern: /^!ping\b/i,
                priority: 5,
                description: 'Responds to ping with pong',
                handler: this.handlePing.bind(this)
            },
            // Bot mentions (MiscManager, bot, etc.) - Highest priority
            {
                id: 'bot-mention',
                extensionId: 'fun-bot',
                pattern: /\b(miscmanager|misc manager|@miscmanager)\b/i,
                priority: 5,
                description: 'Responds when bot is mentioned',
                handler: this.handleBotMention.bind(this)
            },
            // General bot references - Lower priority, excludes mentions
            {
                id: 'bot-reference',
                extensionId: 'fun-bot',
                pattern: /\b(hey bot|hi bot|hello bot)\b(?!.*\b(miscmanager|misc manager)\b)/i,
                priority: 15,
                description: 'Responds to general bot greetings',
                handler: this.handleBotGreeting.bind(this)
            },
            // Greetings
            {
                id: 'greeting',
                extensionId: 'fun-bot',
                pattern: /^(hello|hi|hey|greetings|sup|yo)\b(?!.*bot)/i,
                priority: 20,
                description: 'Responds to general greetings',
                handler: this.handleGreeting.bind(this)
            },
            // Good morning/night
            {
                id: 'time-greeting',
                extensionId: 'fun-bot',
                pattern: /\b(good morning|good night|good afternoon|gm|gn)\b/i,
                priority: 18,
                description: 'Responds to time-based greetings',
                handler: this.handleTimeGreeting.bind(this)
            },
            // Thank you - Only when directed at bot or miscmanager specifically
            {
                id: 'thanks',
                extensionId: 'fun-bot',
                pattern: /\b(thank you|thanks|thx|ty)\b.*(bot|miscmanager)/i,
                priority: 12,
                description: 'Responds to thanks',
                handler: this.handleThanks.bind(this)
            },
            // Compliments to bot - Only match if no MiscManager mention (to avoid conflicts)
            {
                id: 'compliments',
                extensionId: 'fun-bot',
                pattern: /\b(good|great|awesome|amazing|cool|nice|love|best)\b.*\bbot\b(?!.*\b(miscmanager|misc manager)\b)/i,
                priority: 30,
                description: 'Responds to compliments directed at bot',
                handler: this.handleCompliment.bind(this)
            },
            // Insults/roasts to bot - Only match if no MiscManager mention (to avoid conflicts)
            {
                id: 'roasts',
                extensionId: 'fun-bot',
                pattern: /\b(bad|suck|trash|garbage|stupid|dumb|worst)\b.*\bbot\b(?!.*\b(miscmanager|misc manager)\b)/i,
                priority: 30,
                description: 'Playfully responds to insults directed at bot',
                handler: this.handleRoast.bind(this)
            },
            // How are you - Only when directed at bot or miscmanager specifically  
            {
                id: 'how-are-you',
                extensionId: 'fun-bot',
                pattern: /\b(how are you|how\'re you|how r u)\b.*(bot|miscmanager)/i,
                priority: 16,
                description: 'Responds to "how are you" questions',
                handler: this.handleHowAreYou.bind(this)
            },
            // What's up - Only when directed at bot or miscmanager specifically
            {
                id: 'whats-up',
                extensionId: 'fun-bot',
                pattern: /\b(what\'s up|whats up|wassup|wsp)\b.*(bot|miscmanager)/i,
                priority: 17,
                description: 'Responds to "what\'s up" questions',
                handler: this.handleWhatsUp.bind(this)
            }
        ];
    }

    /**
     * Get a random response from an array
     */
    private getRandomResponse(responses: string[]): string {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * Calculate response delay with optional random variation
     */
    private calculateDelay(): number {
        const baseDelay = this.config.responseDelay || this.defaultConfig.responseDelay;
        const variation = this.config.randomDelayVariation || this.defaultConfig.randomDelayVariation;
        
        // Add random variation (±30% by default)
        const randomFactor = 1 + (Math.random() - 0.5) * 2 * variation;
        const delay = Math.round(baseDelay * randomFactor);
        
        // Ensure delay is within bounds
        const minDelay = this.config.minDelay || this.defaultConfig.minDelay;
        const maxDelay = this.config.maxDelay || this.defaultConfig.maxDelay;
        
        return Math.max(minDelay, Math.min(maxDelay, delay));
    }

    /**
     * Send response based on channel with configurable delay
     */
    private async sendResponse(context: ChatMessageContext, message: string, api: ExtensionAPI): Promise<void> {
        // Double-check that extension is enabled before responding
        if (this.config.enabled === false) {
            api.log.debug(`Fun Bot response suppressed - extension is disabled`);
            return;
        }
        
        const delay = this.calculateDelay();
        
        // Add typing indicator effect (optional)
        api.log.debug(`Waiting ${delay}ms before responding to ${context.username}`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (context.channel === 'Guild' || context.channel === 'Officer') {
            api.chat.sendGuildChat(message);
        } else if (context.channel === 'From') {
            api.chat.sendPrivateMessage(context.username, message);
        } else if (context.channel === 'Party') {
            api.chat.sendPartyMessage(message);
        }
    }

    /**
     * Handle ping command
     */
    private async handlePing(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        const now = Date.now();
        
        // Add some variety based on how many times pinged recently
        if (now - this.lastPingTime < 30000) { // Within 30 seconds
            this.pingCount++;
        } else {
            this.pingCount = 1;
        }
        
        this.lastPingTime = now;
        
        let response: string;
        
        if (this.pingCount > 5) {
            response = `Pong! (${this.pingCount}x) Okay, I get it, I'm here! 😅`;
        } else if (this.pingCount > 3) {
            response = `Pong! (${this.pingCount}x) Are you testing my patience? 🤔`;
        } else {
            response = this.getRandomResponse(this.pingResponses);
        }
        
        await this.sendResponse(context, response, api);
        
        api.log.info(`Responded to ping from ${context.username} (count: ${this.pingCount})`);
    }

    /**
     * Handle bot mentions
     */
    private async handleBotMention(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        const response = this.getRandomResponse(this.botMentionResponses);
        await this.sendResponse(context, response, api);
        
        api.log.info(`Responded to bot mention from ${context.username}`);
    }

    /**
     * Handle bot greetings
     */
    private async handleBotGreeting(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        const response = this.getRandomResponse(this.greetingResponses);
        await this.sendResponse(context, `${response} ${context.username}!`, api);
        
        api.log.info(`Responded to bot greeting from ${context.username}`);
    }

    /**
     * Handle general greetings
     */
    private async handleGreeting(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        // Only respond sometimes to avoid spam (30% chance)
        if (Math.random() < 0.3) {
            const response = this.getRandomResponse(this.greetingResponses);
            await this.sendResponse(context, `${response} ${context.username}!`, api);
            
            api.log.info(`Responded to general greeting from ${context.username}`);
        }
    }

    /**
     * Handle time-based greetings
     */
    private async handleTimeGreeting(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        const hour = new Date().getHours();
        let response: string;
        
        if (context.message.toLowerCase().includes('morning') || context.message.toLowerCase().includes('gm')) {
            if (hour < 12) {
                response = 'Good morning! ☀️ Ready to conquer the day?';
            } else {
                response = 'It\'s past noon, but good morning anyway! 😄';
            }
        } else if (context.message.toLowerCase().includes('night') || context.message.toLowerCase().includes('gn')) {
            if (hour >= 18 || hour < 6) {
                response = 'Good night! Sweet dreams! 🌙✨';
            } else {
                response = 'It\'s still daytime, but good night anyway! 😴';
            }
        } else if (context.message.toLowerCase().includes('afternoon')) {
            response = 'Good afternoon! Hope you\'re having a great day! ☀️';
        } else {
            response = this.getRandomResponse(this.greetingResponses);
        }
        
        await this.sendResponse(context, `${response} ${context.username}!`, api);
        
        api.log.info(`Responded to time greeting from ${context.username}`);
    }

    /**
     * Handle thanks
     */
    private async handleThanks(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        const responses = [
            'You\'re welcome! 😊',
            'No problem at all! 👍',
            'Happy to help! ✨',
            'Anytime! That\'s what I\'m here for! 🤖',
            'My pleasure! 😄',
            'Don\'t mention it! 🙌'
        ];
        
        const response = this.getRandomResponse(responses);
        await this.sendResponse(context, `${response} ${context.username}!`, api);
        
        api.log.info(`Responded to thanks from ${context.username}`);
    }

    /**
     * Handle compliments
     */
    private async handleCompliment(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        const response = this.getRandomResponse(this.complimentResponses);
        await this.sendResponse(context, `${response} ${context.username}!`, api);
        
        api.log.info(`Responded to compliment from ${context.username}`);
    }

    /**
     * Handle roasts/insults
     */
    private async handleRoast(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        const response = this.getRandomResponse(this.roastResponses);
        await this.sendResponse(context, `${response} ${context.username}! 😏`, api);
        
        api.log.info(`Responded to roast from ${context.username}`);
    }

    /**
     * Handle "how are you" questions
     */
    private async handleHowAreYou(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        const responses = [
            'I\'m doing great! Thanks for asking! 😊',
            'Running at 100% efficiency! ⚡',
            'Living my best bot life! 🤖✨',
            'I\'m wonderful! How are you doing? 😄',
            'All systems operational! 🚀',
            'Fantastic! Ready to help with whatever you need! 💪',
            'I\'m thriving! Thanks for checking in! 🌟'
        ];
        
        const response = this.getRandomResponse(responses);
        await this.sendResponse(context, `${response} ${context.username}!`, api);
        
        api.log.info(`Responded to "how are you" from ${context.username}`);
    }

    /**
     * Handle "what's up" questions
     */
    private async handleWhatsUp(context: ChatMessageContext, api: ExtensionAPI): Promise<void> {
        const responses = [
            'Just hanging out in the guild! 🏠',
            'Watching the chat and ready to help! 👀',
            'Living the bot life! What about you? 🤖',
            'Nothing much, just being awesome! 😎',
            'Monitoring guild activities! 📊',
            'Just chilling and processing data! 💭',
            'The usual - being the best bot I can be! ⭐'
        ];
        
        const response = this.getRandomResponse(responses);
        await this.sendResponse(context, `${response} ${context.username}!`, api);
        
        api.log.info(`Responded to "what's up" from ${context.username}`);
    }
}

export default FunBotExtension;
