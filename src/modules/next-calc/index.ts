import { bwStats, resolvePlayer, type BwStats } from '@/modules/stats/shared';
import type { ModuleCommand } from '@/modules/types';
import cooldowns, { replyIfOnCooldown } from '@/util/cooldown';
import { compactNumber, randomHex } from '@/util/formatting';

// ── Shared helpers ───────────────────────────────────────────────────────────

/** Next-calc replies show millions with two decimals, e.g. "1.25M". */
function fmt(n: number): string {
    return compactNumber(n, 2);
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

/** XP and games still needed to reach the `target` star. Also used by `/next level`. */
export function levelGoal(
    stats: BwStats,
    target: number,
    avgXp: number
): { targetXp: number; neededXp: number; games: number } {
    const targetXp = xpForLevel(target);
    const neededXp = Math.max(0, targetXp - stats.xp);
    return { targetXp, neededXp, games: Math.ceil(neededXp / Math.max(1, avgXp)) };
}

// ── Calculators ──────────────────────────────────────────────────────────────

function calcNextFkdr(s: BwStats, target: number | null): string {
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

function calcNextBblr(s: BwStats, target: number | null): string {
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

function calcNextLevel(s: BwStats, target: number | null, avgXp: number): string {
    // Default target: next prestige boundary (next multiple of 100).
    const tgt = target !== null ? Math.floor(target) : (Math.floor(s.lvl / 100) + 1) * 100;
    if (tgt <= s.lvl) {
        return `Already at ★${s.lvl} (target ★${tgt})`;
    }
    const { neededXp, games } = levelGoal(s, tgt, avgXp);
    return (
        `★${s.lvl} → ★${tgt} | Need ${fmt(neededXp)} XP | ` +
        `~${fmt(games)} games @ ${avgXp} xp/game`
    );
}

// ── In-game command handlers ────────────────────────────────────────────────

type CalcFn = (s: BwStats, target: number | null) => string;

function makeNextCmd(
    commandId: string,
    pattern: RegExp,
    label: string,
    calc: CalcFn
): ModuleCommand {
    return {
        commandId,
        pattern,
        async handler(ctx, bridge) {
            if (replyIfOnCooldown(ctx, bridge, commandId)) return;
            const { user, target } = parseUserAndTarget(
                ctx.matches[1],
                ctx.matches[2],
                ctx.username
            );
            const result = await resolvePlayer(user, bridge, ctx.replyChannel);
            if (!result) return;
            const body = calc(bwStats(result.player), target);
            bridge.bot.chat(
                ctx.replyChannel,
                `[${label}] ${result.name} | ${body} | ${randomHex()}`
            );
            cooldowns.setCooldown(ctx.username, commandId, ctx.guildRank);
        },
    };
}

export function registerNextCalcModule(commands: ModuleCommand[]): void {
    // !nfkdr [user] [target]
    commands.push(
        makeNextCmd('next:fkdr', /^!nfkdr(?:\s+(\S+))?(?:\s+(\S+))?\s*$/i, 'nFKDR', calcNextFkdr)
    );

    // !nbblr [user] [target]
    commands.push(
        makeNextCmd('next:bblr', /^!nbblr(?:\s+(\S+))?(?:\s+(\S+))?\s*$/i, 'nBBLR', calcNextBblr)
    );

    // !nlevel [user] [target] [avg_xp]
    commands.push({
        commandId: 'next:level',
        pattern: /^!nlevel(?:\s+(\S+))?(?:\s+(\S+))?(?:\s+(\S+))?\s*$/i,
        async handler(ctx, bridge) {
            const commandId = 'next:level';
            if (replyIfOnCooldown(ctx, bridge, commandId)) return;
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

            const result = await resolvePlayer(user, bridge, ctx.replyChannel);
            if (!result) return;
            const body = calcNextLevel(bwStats(result.player), target, avgXp);
            bridge.bot.chat(ctx.replyChannel, `[nLevel] ${result.name} | ${body} | ${randomHex()}`);
            cooldowns.setCooldown(ctx.username, commandId, ctx.guildRank);
        },
    });
}
