import fetchMojangProfile from '../../../../requests/fetch-mojang-profile';

const commandCooldowns = new Map<string, number>();

function getRandomHexColor(): string {
    return `#${Math.floor(Math.random() * 0xffffffffffffff)
        .toString(16)
        .padStart(6, '0')}`;
}

const allowedGuildRanks = ['Member', 'Active', 'Elite', 'Mod', 'Admin', 'GM'];

function isOnCooldown(playerName: string, guildRank: string, now: number): number | null {
    let cooldownTime: number | undefined;
    if (guildRank.includes('Member')) {
        cooldownTime = 4 * 60 * 1000; // 4 minutes
    } else if (guildRank.includes('Active')) {
        cooldownTime = 2 * 60 * 1000; // 2 minutes
    }
    if (cooldownTime) {
        const lastRun = commandCooldowns.get(playerName);
        if (lastRun && now - lastRun < cooldownTime) {
            return Math.ceil((cooldownTime - (now - lastRun)) / 1000);
        }
    }
    return null;
}

async function fetchMMPlayerData(playerName: string): Promise<any> {
    const resp = await fetchMojangProfile(playerName);
    if (!('id' in resp)) {
        throw new Error('not_found');
    }
    const response = await fetch(
        `https://api.hypixel.net/player?key=${process.env.HYPIXEL_API_KEY}&uuid=${resp.id}`
    );
    const data = await response.json();

    if (
        !data.success &&
        data.cause ===
            'You have already looked up this player too recently, please try again shortly'
    ) {
        throw new Error('lookedup_recently');
    } else if (data.success && data.player === null) {
        throw new Error('not_found');
    }

    if (!data.player.stats || !data.player.stats.MurderMystery || !data.player.achievements) {
        throw new Error('incomplete_data');
    }

    return data.player;
}

function buildMMStatsMessage(lookupName: string, achievements: any, stats: any): string {
    const { wins } = stats;
    const gamesPlayed = stats.games;
    const { kills } = stats;
    const { deaths } = stats;
    const kdr = (kills / deaths).toFixed(2);
    return `/gc [MM-STATS] IGN: ${lookupName} | KILLS: ${kills} | WINS: ${wins} | KDR: ${kdr} | GAMES PLAYED: ${gamesPlayed} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:mm-stats',
    runOnce: false,
    run: async (
        bot,
        channel: string,
        playerRank: string,
        playerName: string,
        guildRank: string,
        target: string
    ) => {
        const now = Date.now();

        // Check cooldowns
        const cooldown = isOnCooldown(playerName, guildRank, now);
        if (cooldown !== null) {
            bot.executeCommand(
                `/gc ${playerName}, you can only use this command again in ${cooldown} seconds. Please wait. | ${getRandomHexColor()}`
            );
            return;
        }
        commandCooldowns.set(playerName, now);

        // Only allowed roles may use this command
        if (!allowedGuildRanks.some((rank) => guildRank.includes(rank))) {
            return;
        }
        const lookupName = target && target.trim() !== '' ? target.trim() : playerName;
        try {
            const playerData = await fetchMMPlayerData(lookupName);
            console.log(
                `[DEBUG] ${playerName} successfully fetched MurderMystery stats for ${lookupName}`
            );

            const { achievements } = playerData;
            const stats = playerData.stats.MurderMystery;

            bot.executeCommand(buildMMStatsMessage(lookupName, achievements, stats));
            return playerData;
        } catch (err: any) {
            console.error(`[ERROR] Failed to fetch MurderMystery stats for ${lookupName}: ${err}`);
            let errorMsg: string;
            if (err.message === 'lookedup_recently') {
                errorMsg = `the player ${lookupName} was looked up recently. Please try again later.`;
            } else if (err.message === 'not_found') {
                errorMsg =
                    lookupName === playerName
                        ? `the player ${lookupName} was not found. Are they nicked?`
                        : `the player ${lookupName} was not found.`;
            } else if (err.message === 'incomplete_data') {
                errorMsg = `Incomplete player data received for ${lookupName}!`;
            } else {
                errorMsg = 'An error occurred while fetching player stats.';
            }
            bot.executeCommand(`/gc ${playerName}, ${errorMsg} | ${getRandomHexColor()}`);
        }
    },
} as Event;
