import { Collection, User } from 'discord.js';

const pingRegex = /<@(\d+)>/g;

/**
 * Replaces Discord user pings by their username.
 *
 * Additional checks for bad/banned words should probably be added
 * @param userCache Cache of user data indexed by their ID, removes the need to do API calls
 * @param content Message to replace the pings in
 * @returns Updated message
 */
export default function replaceUserPings(userCache: Collection<string, User>, content: string): string {
    let newContent = content;
    const userPings = content.matchAll(pingRegex);

    // eslint-disable-next-line no-restricted-syntax
    for (const userPing of userPings) {
        const userId = userPing.at(1);
        if (!userId) {
            continue;
        }
        const userData = userCache.get(userId);
        if (userData) {
            newContent = newContent.replaceAll(new RegExp(`<@${userId}>`, 'g'), `@${userData.username}`);
        }
    }

    return newContent;
}
