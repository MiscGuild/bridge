const commandCooldowns = new Map<string, number>();
import env from '../../../../util/env';
import fetchMojangProfile from '../../../../requests/fetch-mojang-profile';

function getRandomHexColor(): string {
    return (
        '#' +
        Math.floor(Math.random() * 0xffffffffffffff)
            .toString(16)
            .padStart(6, '0')
    );
}

const allowedGuildRanks = ['Member', 'Active', 'Elite', 'Mod', 'Admin', 'GM'];

function isOnCooldown(playerName: string, guildRank: string, now: number): number | null {
    let cooldownTime: number | undefined;
    if (guildRank.includes('Member')) {
        cooldownTime = env.COMMAND_COOLDOWN_MEMBER;
    } else if (guildRank.includes('Active')) {
        cooldownTime = env.COMMAND_COOLDOWN_ACTIVE;
    }
    if (cooldownTime) {
        const lastRun = commandCooldowns.get(playerName);
        if (lastRun && now - lastRun < cooldownTime) {
            return Math.ceil((cooldownTime - (now - lastRun)) / 1000);
        }
    }
    return null;
}

async function fetchPlayerData(playerName: string): Promise<any> {
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

    if (!data.player.stats || !data.player.stats.Bedwars || !data.player.achievements) {
        throw new Error('incomplete_data');
    }

    return data.player;
}

function buildStatsMessage(playerName: string, achievements: any, stats: any): string {
    const level = achievements.bedwars_level;
    const wins = achievements.bedwars_wins;
    const fkdr = (stats.final_kills_bedwars / stats.final_deaths_bedwars).toFixed(2);
    const bblr = (achievements.bedwars_beds / stats.beds_lost_bedwars).toFixed(2);
    const wlr = (wins / stats.losses_bedwars).toFixed(2);
    return `/gc [BW-STATS] IGN: ${playerName} | LVL: ${level} | WINS: ${wins} | FKDR: ${fkdr} | BBLR: ${bblr} | WLR: ${wlr} | ${getRandomHexColor()}`;
}

export default {
    name: 'chat:bw-stats',
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
        const cooldown = isOnCooldown(playerName, guildRank, now);
        if (cooldown !== null) {
            bot.executeCommand(
                `/gc ${playerName}, you can only use this command again in ${cooldown} seconds. Please wait. | ${getRandomHexColor()}`
            );
            return;
        }
        commandCooldowns.set(playerName, now);

        // Only allowed roles can use this command
        if (!allowedGuildRanks.some((rank) => guildRank.includes(rank))) {
            return;
        }

        // Determine the lookup name: use target if provided, otherwise use the player's own name
        const lookupName = target && target.trim() !== '' ? target.trim() : playerName;

        try {
            const playerData = await fetchPlayerData(lookupName);
            console.log(`[DEBUG] ${playerName} successfully fetched stats for ${lookupName}`);
            const achievements = playerData.achievements;
            const stats = playerData.stats.Bedwars;
            bot.executeCommand(buildStatsMessage(lookupName, achievements, stats));
            return playerData;
        } catch (err: any) {
            console.error(`[ERROR] Failed to fetch stats for ${lookupName}: ${err}`);
            let errorMsg = '';
            if (err.message === 'lookedup_recently') {
                errorMsg = `The player ${lookupName} was looked up recently. Please try again later.`;
            } else if (err.message === 'not_found') {
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
    },
} as Event;
