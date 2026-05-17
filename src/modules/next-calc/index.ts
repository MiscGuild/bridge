import type Bridge from '@/bridge/bridge';
import type { ModuleCommand, CommandContext } from '@/modules/types';
import { hypixelService } from '@/services/hypixel';
import { mojangService } from '@/services/mojang';
import cooldowns from '@/util/cooldown';

// ── Shared helpers ───────────────────────────────────────────────────────────

function hex(): string {
    return `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0')}`;
}

function fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
}

function fmtRatio(n: number): string {
    return Number.isFinite(n) ? n.toFixed(2) : '∞';
}

/** Parse a target number that may use a comma decimal (e.g. "3,5" → 3.5). */
function parseTargetNumber(s: string | undefined): number | null {
    if (s === undefined) return null;
    const cleaned = s.replace(',', '.').trim();
    if (cleaned === '' || !/^-?\d+(?:\.\d+)?$/.test(cleaned)) return null;
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
}

/** Round-up to the next 0.5 step. */
function nextHalfStep(current: number): number {
    return Math.floor(current * 2 + 1) / 2;
}

async function resolveBw(
    username: string,
    bridge: Bridge,
    replyChannel: 'gc' | 'oc'
): Promise<{ name: string; player: any } | null> {
    const profile = await mojangService.getProfile(username);
    if (!profile) {
        bridge.bot.chat(replyChannel, `Could not find player: ${username}`);
        return null;
    }
    const player = await hypixelService.getPlayer(profile.id);
    if (!player) {
        bridge.bot.chat(replyChannel, `Could not fetch Hypixel data for ${username}`);
        return null;
    }
    return { name: profile.name, player };
}

/**
 * Parse `[user] [target]` style args where either may be omitted.
 * - If only one arg and it parses as a number → it's the target.
 * - If only one arg and not numeric → it's the username.
 * - If two args → user, then target.
 */
function parseUserAndTarget(
    a: string | undefined,
    b: string | undefined,
    self: string
): { user: string; target: number | null } {
    if (a && b) {
        return { user: a, target: parseTargetNumber(b) };
    }
    if (a) {
        const asNum = parseTargetNumber(a);
        if (asNum !== null) return { user: self, target: asNum };
        return { user: a, target: null };
    }
    return { user: self, target: null };
}

// ── BedWars stats extraction ─────────────────────────────────────────────────

interface BwOverall {
    lvl: number;
    xp: number;
    fk: number;
    fd: number;
    bb: number;
    bl: number;
}

function bwOverall(player: any): BwOverall {
    const ach = player.achievements ?? {};
    const s = (player.stats?.Bedwars as Record<string, number>) ?? {};
    return {
        lvl: ach.bedwars_level ?? 0,
        xp: Number(s.Experience ?? s.Experience_new ?? 0),
        fk: s.final_kills_bedwars ?? 0,
        fd: s.final_deaths_bedwars ?? 0,
        bb: s.beds_broken_bedwars ?? 0,
        bl: s.beds_lost_bedwars ?? 0,
    };
}

// ── BedWars star ↔ XP formula ────────────────────────────────────────────────
// Standard Hypixel BedWars formula:
//   First 4 levels of each prestige (the "easy levels"): 500, 1000, 2000, 3500.
//   Levels 5-100 within a prestige: 5000 each.
//   Total XP per prestige (100 levels): 7000 + 96 * 5000 = 487,000.

const XP_PER_PRESTIGE = 487_000;
const EASY_CUMULATIVE = [0, 500, 1500, 3500, 7000] as const; // cumulative within prestige

/** Cumulative XP from level 0 needed to *reach* `level`. */
function xpForLevel(level: number): number {
    if (level <= 0) return 0;
    const prestiges = Math.floor(level / 100);
    const rem = level % 100;
    const withinPrestige =
        rem <= 4 ? EASY_CUMULATIVE[rem]! : EASY_CUMULATIVE[4]! + (rem - 4) * 5000;
    return prestiges * XP_PER_PRESTIGE + withinPrestige;
}

// ── Calculators ──────────────────────────────────────────────────────────────

function calcNextFkdr(s: BwOverall, target: number | null): string {
    const current = s.fd === 0 ? (s.fk > 0 ? Infinity : 0) : s.fk / s.fd;
    const tgt = target ?? nextHalfStep(Number.isFinite(current) ? current : 0);
    if (Number.isFinite(current) && current >= tgt) {
        return `Already at FKDR ${fmtRatio(current)} (target ${tgt.toFixed(2)})`;
    }
    // needed_fk such that (fk + needed_fk) / fd = tgt → needed_fk = tgt * fd - fk
    const needed = Math.max(0, Math.ceil(tgt * s.fd - s.fk));
    return (
        `Current FKDR ${fmtRatio(current)} → ${tgt.toFixed(2)} | ` +
        `Need +${fmt(needed)} FK (assuming 0 final deaths)`
    );
}

function calcNextBblr(s: BwOverall, target: number | null): string {
    const current = s.bl === 0 ? (s.bb > 0 ? Infinity : 0) : s.bb / s.bl;
    const tgt = target ?? nextHalfStep(Number.isFinite(current) ? current : 0);
    if (Number.isFinite(current) && current >= tgt) {
        return `Already at BBLR ${fmtRatio(current)} (target ${tgt.toFixed(2)})`;
    }
    const needed = Math.max(0, Math.ceil(tgt * s.bl - s.bb));
    return (
        `Current BBLR ${fmtRatio(current)} → ${tgt.toFixed(2)} | ` +
        `Need +${fmt(needed)} beds broken (assuming 0 beds lost)`
    );
}

function calcNextLevel(s: BwOverall, target: number | null, avgXp: number): string {
    // Default target: next prestige boundary (next multiple of 100).
    const tgt = target !== null ? Math.floor(target) : (Math.floor(s.lvl / 100) + 1) * 100;
    if (tgt <= s.lvl) {
        return `Already at ★${s.lvl} (target ★${tgt})`;
    }
    const targetXp = xpForLevel(tgt);
    const needed = Math.max(0, targetXp - s.xp);
    const games = Math.ceil(needed / Math.max(1, avgXp));
    return (
        `★${s.lvl} → ★${tgt} | Need ${fmt(needed)} XP | ` +
        `~${fmt(games)} games @ ${avgXp} xp/game`
    );
}

// ── In-game command handlers ────────────────────────────────────────────────

type CalcFn = (s: BwOverall, target: number | null) => string;

function makeNextCmd(
    cmdId: string,
    pattern: RegExp,
    label: string,
    calc: CalcFn
): ModuleCommand {
    return {
        commandId: cmdId,
        pattern,
        async handler(ctx, bridge) {
            const remaining = cooldowns.isOnCooldown(ctx.username, ctx.guildRank, cmdId);
            if (remaining > 0) {
                bridge.bot.chat(ctx.replyChannel, `${ctx.username}, cooldown: ${remaining}s`);
                return;
            }
            const { user, target } = parseUserAndTarget(
                ctx.matches[1],
                ctx.matches[2],
                ctx.username
            );
            const result = await resolveBw(user, bridge, ctx.replyChannel);
            if (!result) return;
            const stats = bwOverall(result.player);
            const body = calc(stats, target);
            bridge.bot.chat(
                ctx.replyChannel,
                `[${label}] ${result.name} | ${body} | ${hex()}`
            );
            cooldowns.setCooldown(ctx.username, cmdId, ctx.guildRank);
        },
    };
}

export function registerNextCalcModule(commands: ModuleCommand[]): void {
    // !nfkdr [user] [target]
    commands.push(
        makeNextCmd(
            'next:fkdr',
            /^!nfkdr(?:\s+(\S+))?(?:\s+(\S+))?\s*$/i,
            'nFKDR',
            calcNextFkdr
        )
    );

    // !nbblr [user] [target]
    commands.push(
        makeNextCmd(
            'next:bblr',
            /^!nbblr(?:\s+(\S+))?(?:\s+(\S+))?\s*$/i,
            'nBBLR',
            calcNextBblr
        )
    );

    // !nlevel [user] [target] [avg_xp]
    commands.push({
        commandId: 'next:level',
        pattern: /^!nlevel(?:\s+(\S+))?(?:\s+(\S+))?(?:\s+(\S+))?\s*$/i,
        async handler(ctx, bridge) {
            const cmdId = 'next:level';
            const remaining = cooldowns.isOnCooldown(ctx.username, ctx.guildRank, cmdId);
            if (remaining > 0) {
                bridge.bot.chat(ctx.replyChannel, `${ctx.username}, cooldown: ${remaining}s`);
                return;
            }
            // For !nlevel we have up to 3 positional args. Decide layout:
            //   [user] [target] [avg_xp]   where each can be omitted from the left.
            //   - 3 args  → user, target, avg_xp
            //   - 2 args  → if first is numeric → (self, target, avg_xp);
            //               else (user, target, default avg_xp)
            //   - 1 arg   → numeric → (self, target); else (user, default target)
            //   - 0 args  → (self, default target, default avg_xp)
            const a = ctx.matches[1];
            const b = ctx.matches[2];
            const c = ctx.matches[3];

            let user = ctx.username;
            let target: number | null = null;
            let avgXp = 150;

            if (a && b && c) {
                user = a;
                target = parseTargetNumber(b);
                avgXp = parseTargetNumber(c) ?? 150;
            } else if (a && b) {
                const aNum = parseTargetNumber(a);
                if (aNum !== null) {
                    target = aNum;
                    avgXp = parseTargetNumber(b) ?? 150;
                } else {
                    user = a;
                    target = parseTargetNumber(b);
                }
            } else if (a) {
                const aNum = parseTargetNumber(a);
                if (aNum !== null) target = aNum;
                else user = a;
            }

            if (avgXp <= 0) avgXp = 150;

            const result = await resolveBw(user, bridge, ctx.replyChannel);
            if (!result) return;
            const stats = bwOverall(result.player);
            const body = calcNextLevel(stats, target, avgXp);
            bridge.bot.chat(
                ctx.replyChannel,
                `[nLevel] ${result.name} | ${body} | ${hex()}`
            );
            cooldowns.setCooldown(ctx.username, cmdId, ctx.guildRank);
        },
    });
}

// Exported for the Discord `/next level` command so we don't duplicate logic.
export const nextCalc = {
    bwOverall,
    xpForLevel,
    calcNextLevel,
};
