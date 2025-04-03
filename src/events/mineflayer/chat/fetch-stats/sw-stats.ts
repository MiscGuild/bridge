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

async function fetchSWPlayerData(lookupName: string): Promise<any> {
    const resp = await fetchMojangProfile(lookupName);
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

    if (!data.player.stats || !data.player.stats.SkyWars || !data.player.achievements) {
        throw new Error('incomplete_data');
    }

    return data.player;
}

function buildSWStatsMessage(
    lookupName: string,
    achievements: any,
    stats: any,
    isSelfLookup: boolean
): string {
    const playerLevel = stats.levelFormatted;
    const rm_playerLevel = playerLevel.split(new RegExp('§[a-zA-Z0-9]'))[1];

    const winsSolo = achievements.skywars_wins_solo;
    const winsTeams = achievements.skywars_wins_team;
    const killsSolo = achievements.skywars_kills_solo;
    const killsTeams = achievements.skywars_kills_team;

    const totalWins = winsSolo + winsTeams;
    const totalKills = killsSolo + killsTeams;
    const { deaths } = stats;
    const kdr = totalKills / deaths;
    const { losses } = stats;
    const wlr = totalWins / losses;

    return `/gc [SW-STATS] IGN: ${lookupName} | LVL: ${rm_playerLevel} | WINS: ${totalWins} | KDR: ${kdr.toFixed(
        2
    )} | WLR: ${wlr.toFixed(2)} | Total Kills: ${totalKills} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:sw-stats',
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

        // Check command cooldown for the user.
        const cooldown = isOnCooldown(playerName, guildRank, now);
        if (cooldown !== null) {
            bot.executeCommand(
                `/gc ${playerName}, you can only use this command again in ${cooldown} seconds. Please wait. | ${getRandomHexColor()}`
            );
            return;
        }
        commandCooldowns.set(playerName, now);

        // Only allowed guild roles may use this command.
        if (!allowedGuildRanks.some((rank) => guildRank.includes(rank))) {
            return;
        }

        // Determine lookup name: if target is empty, use the player's own name.
        const lookupName = target && target.trim() !== '' ? target.trim() : playerName;
        const isSelfLookup = lookupName === playerName;

        try {
            const playerData = await fetchSWPlayerData(lookupName);
            console.log(
                `[DEBUG] ${playerName} successfully fetched SkyWars stats for ${lookupName}`
            );

            const { achievements } = playerData;
            const stats = playerData.stats.SkyWars;

            const message = buildSWStatsMessage(lookupName, achievements, stats, isSelfLookup);
            bot.executeCommand(message);
            return playerData;
        } catch (err: any) {
            console.error(`[ERROR] Failed to fetch SkyWars stats for ${lookupName}: ${err}`);
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
