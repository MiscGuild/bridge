import logger from 'consola';
import getRandomHexColor from './getRandomHexColor';

export interface FetchError {
    error: string;
    status?: number;
    statusText?: string;
    details?: any;
}

/**
 * Type guard to check if a response is a FetchError.
 */
export function isFetchError(response: unknown): response is FetchError {
    return (
        typeof response === 'object' &&
        response !== null &&
        'error' in response &&
        typeof (response as any).error === 'string'
    );
}

/**
 * Handles a FetchError and sends an appropriate message to the player.
 */
export function handleFetchError(
    playerData: FetchError,
    playerName: string,
    lookupName: string,
    bot: { executeCommand: (cmd: string) => void }
): void {
    logger.error(
        `[ERROR] Failed to fetch stats for ${lookupName}: ${
            playerData.statusText ?? playerData.error
        }`
    );

    let errorMsg = '';
    const statusText = playerData.statusText ?? playerData.error;

    if (
        statusText ===
            'You have already looked up this player too recently, please try again shortly' ||
        statusText === 'Too Many Requests'
    ) {
        errorMsg = `The player ${lookupName} was looked up recently. Please try again later.`;
    } else if (playerData.status === 404) {
        errorMsg =
            lookupName === playerName
                ? `The player ${lookupName} was not found. Are they nicked?`
                : `The player ${lookupName} was not found.`;
    } else {
        errorMsg =
            'An error occurred while fetching player stats. Please report this to the bot owner.';
    }

    bot.executeCommand(`/gc ${playerName}, ${errorMsg} | ${getRandomHexColor()}`);
}
