import fs from 'fs';
import path from 'path';

export interface BanCheckResult {
    isBanned: boolean;
    banType?: 'guild' | 'bridge' | 'command';
    reason?: string;
    endDate?: string;
}

/**
 * Check if a user is banned and what type of ban they have
 */
export function checkUserBan(uuid: string): BanCheckResult {
    try {
        const banListPath = path.join(process.cwd(), 'data', 'staff-bans.json');
        const banListData = fs.readFileSync(banListPath, 'utf8');
        const banList = JSON.parse(banListData);

        const ban = banList.bans?.find((entry: any) => entry.uuid === uuid);

        if (!ban) {
            return { isBanned: false };
        }

        return {
            isBanned: true,
            banType: ban.type,
            reason: ban.reason,
            endDate: ban.endDate,
        };
    } catch (error) {
        console.error('Error reading ban list:', error);
        return { isBanned: false };
    }
}

/**
 * Check if a user is banned by username (fetches UUID first)
 */
export async function checkUserBanByUsername(username: string): Promise<BanCheckResult> {
    try {
        // First check by username in ban list
        const banListPath = path.join(process.cwd(), 'data', 'staff-bans.json');
        const banListData = fs.readFileSync(banListPath, 'utf8');
        const banList = JSON.parse(banListData);

        const ban = banList.bans?.find(
            (entry: any) => entry.name.toLowerCase() === username.toLowerCase()
        );

        if (!ban) {
            return { isBanned: false };
        }

        return {
            isBanned: true,
            banType: ban.type,
            reason: ban.reason,
            endDate: ban.endDate,
        };
    } catch (error) {
        console.error('Error reading ban list:', error);
        return { isBanned: false };
    }
}

/**
 * Check if a username is command-banned
 */
export function isCommandBanned(username: string): boolean {
    const result = checkUserBanByUsernameSync(username);
    return result.isBanned && result.banType === 'command';
}

/**
 * Check if a username is bridge-banned
 */
export function isBridgeBanned(username: string): boolean {
    const result = checkUserBanByUsernameSync(username);
    return result.isBanned && result.banType === 'bridge';
}

/**
 * Synchronous version of checkUserBanByUsername
 */
function checkUserBanByUsernameSync(username: string): BanCheckResult {
    try {
        const banListPath = path.join(process.cwd(), 'data', 'staff-bans.json');
        const banListData = fs.readFileSync(banListPath, 'utf8');
        const banList = JSON.parse(banListData);

        const ban = banList.bans?.find(
            (entry: any) => entry.name.toLowerCase() === username.toLowerCase()
        );

        if (!ban) {
            return { isBanned: false };
        }

        return {
            isBanned: true,
            banType: ban.type,
            reason: ban.reason,
            endDate: ban.endDate,
        };
    } catch (error) {
        console.error('Error reading ban list:', error);
        return { isBanned: false };
    }
}
