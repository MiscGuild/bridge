const commandCooldowns = new Map<string, number>();

export function isOnCooldown(playerName: string, guildRank: string, now: number): number | null {
    let cooldownTime: number | undefined;
    if (guildRank.includes('Member')) {
        cooldownTime = 1 * 60 * 1000;
    }

    if (cooldownTime) {
        const lastRun = commandCooldowns.get(playerName);
        if (lastRun && now - lastRun < cooldownTime) {
            return Math.ceil((cooldownTime - (now - lastRun)) / 1000);
        }
    }

    return null;
}

export function setCooldown(playerName: string, now: number): void {
    commandCooldowns.set(playerName, now);
}
