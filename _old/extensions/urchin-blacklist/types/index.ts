/**
 * Type definitions for Urchin Blacklist Extension
 */

// Import shared types from the main project
export interface ChatMessageContext {
    message: string;
    username: string;
    channel?: 'Guild' | 'Officer' | 'From' | 'Party' | string;
    rank?: string;
    guildRank?: string;
    timestamp: Date;
    raw: string;
    matches?: RegExpMatchArray;
}

export interface ExtensionAPI {
    log: any;
    events: any;
    config: any;
    chat: {
        sendGuildChat: (message: string) => void;
        sendOfficerChat: (message: string) => void;
        sendPrivateMessage: (username: string, message: string) => void;
        sendPartyMessage: (message: string) => void;
    };
    discord: {
        send: (channelId: string, content: any, color?: number, ping?: boolean) => Promise<any>;
        sendMessage: (channelId: string, content: any) => Promise<any>;
        sendEmbed: (channelId: string, embed: any) => Promise<any>;
    };
    utils: Record<string, any>;
}

export interface ChatPattern {
    id: string;
    extensionId: 'urchin-blacklist';
    pattern: RegExp;
    priority: number;
    description?: string;
    passthrough?: boolean;
    handler: (context: ChatMessageContext, api: ExtensionAPI) => Promise<void> | void;
}

// Urchin API specific types
export interface UrchinPlayerData {
    success: boolean;
    player?: {
        uuid: string;
        tags: string[];
        // Add other properties as needed
    };
    error?: string;
}

export interface MojangProfile {
    id: string;
    name: string;
}
