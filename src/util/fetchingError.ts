import logger from 'consola';
import getRandomHexColor from './getRandomHexColor';

export default function handleFetchError(
    playerData: FetchError,
    playerName: string,
    lookupName: string,
    bot: { executeCommand: (cmd: string) => void }
): void {
    logger.error(`[ERROR] Failed to fetch stats for ${lookupName}: ${playerData.statusText}`);
    let errorMsg = '';

    if (
        playerData.statusText ===
        'You have already looked up this player too recently, please try again shortly' ||
        playerData.statusText === 'Too Many Requests'
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
