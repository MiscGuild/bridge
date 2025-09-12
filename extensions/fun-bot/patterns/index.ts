/**
 * Example chat patterns for fun-bot
 */

export const chatPatterns = {
    // Example: Match "!help" command
    helpCommand: /^!help(?:\s+(.*))?$/i,
    
    // Example: Match "!fun-bot" command
    mainCommand: /^!fun-bot(?:\s+(.*))?$/i,
    
    // Example: Match mentions of the extension
    mention: new RegExp(`fun-bot`, 'i'),
    
    // Example: Match specific keywords
    keywords: /\b(stats|info|help|status)\b/i
};

export default chatPatterns;
