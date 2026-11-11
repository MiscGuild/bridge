import type Bridge from '@/bridge/bridge';
import { hypixelService, type HypixelPlayerResponse } from '@/services/hypixel';
import { mojangService, type MojangProfile } from '@/services/mojang';

/** Helpers shared by the stats, compare and next-calc modules (and `/next`). */

export function bwStar(level: number): string {
    return `[${level}${level >= 1000 ? '✫' : '✪'}]`;
}

export interface BwStats {
    lvl: number;
    xp: number;
    w: number;
    l: number;
    fk: number;
    fd: number;
    bb: number;
    bl: number;
}

/** BedWars counters for one mode (`prefix` like 'eight_one_'), or overall with no prefix. */
export function bwStats(player: HypixelPlayerResponse, prefix = ''): BwStats {
    const s = (player.stats?.Bedwars as Record<string, number> | undefined) ?? {};
    return {
        lvl: player.achievements?.bedwars_level ?? 0,
        xp: Number(s.Experience ?? s.Experience_new ?? 0),
        w: s[`${prefix}wins_bedwars`] ?? 0,
        l: s[`${prefix}losses_bedwars`] ?? 0,
        fk: s[`${prefix}final_kills_bedwars`] ?? 0,
        fd: s[`${prefix}final_deaths_bedwars`] ?? 0,
        bb: s[`${prefix}beds_broken_bedwars`] ?? 0,
        bl: s[`${prefix}beds_lost_bedwars`] ?? 0,
    };
}

export interface BwMode {
    key: string;
    /** Shown in replies, e.g. "[BW 2s]" */
    label: string;
    /** Hypixel stat key prefix */
    prefix: string;
    /** What players can type, e.g. `!bw duos` */
    aliases: string[];
}

export const BW_MODES: readonly BwMode[] = [
    { key: 'solo', label: 'Solo', prefix: 'eight_one_', aliases: ['solo', '1s', 'solos'] },
    { key: 'doubles', label: '2s', prefix: 'eight_two_', aliases: ['doubles', '2s', 'duos'] },
    {
        key: 'threes',
        label: '3s',
        prefix: 'four_three_',
        aliases: ['threes', '3s', '3v3', 'trios'],
    },
    {
        key: 'fours',
        label: '4s',
        prefix: 'four_four_',
        aliases: ['fours', '4s', '4v4v4v4', 'quads'],
    },
    { key: '4v4', label: '4v4', prefix: 'two_four_', aliases: ['4v4'] },
];

/** Regex group matching any BedWars mode alias. */
export const BW_MODE_ALIASES = `(?:${BW_MODES.flatMap((m) => m.aliases).join('|')})`;

export function bwModeFromAlias(alias: string): BwMode | undefined {
    const lower = alias.toLowerCase();
    return BW_MODES.find((m) => m.aliases.includes(lower));
}

/**
 * Mojang profile plus Hypixel data for a username.
 * Null when the username doesn't exist; `player` is null when Hypixel has no data.
 */
export async function lookupPlayer(
    username: string
): Promise<{ profile: MojangProfile; player: HypixelPlayerResponse | null } | null> {
    const profile = await mojangService.getProfile(username);
    if (!profile) return null;
    return { profile, player: await hypixelService.getPlayer(profile.id) };
}

/** {@link lookupPlayer} for in-game commands: explains any failure in chat and returns null. */
export async function resolvePlayer(
    username: string,
    bridge: Bridge,
    replyChannel: 'gc' | 'oc'
): Promise<{ uuid: string; name: string; player: HypixelPlayerResponse } | null> {
    const found = await lookupPlayer(username);
    if (!found) {
        bridge.bot.chat(replyChannel, `Could not find player: ${username}`);
        return null;
    }
    if (!found.player) {
        bridge.bot.chat(replyChannel, `Could not fetch Hypixel data for ${username}`);
        return null;
    }
    return { uuid: found.profile.id, name: found.profile.name, player: found.player };
}
