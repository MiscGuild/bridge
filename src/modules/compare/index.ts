import type Bridge from '@/bridge/bridge';
import type { ModuleCommand, CommandContext } from '@/modules/types';
import { hypixelService } from '@/services/hypixel';
import { mojangService } from '@/services/mojang';
import cooldowns from '@/util/cooldown';

// ── Shared helpers (mirrors src/modules/stats/index.ts style) ────────────────

function ratio(a: number, b: number): string {
    if (b === 0) return a > 0 ? String(a) : '0';
    return (a / b).toFixed(2);
}

function hex(): string {
    return `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0')}`;
}

function bwStar(level: number): string {
    const sym = level >= 1000 ? '✫' : '✪';
    return `[${level}${sym}]`;
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

interface BwSnapshot {
    name: string;
    lvl: number;
    w: number;
    l: number;
    fk: number;
    fd: number;
    bb: number;
    bl: number;
}

function snapshot(name: string, player: any, prefix: string): BwSnapshot {
    const ach = player.achievements ?? {};
    const s = (player.stats?.Bedwars as Record<string, number>) ?? {};
    return {
        name,
        lvl: ach.bedwars_level ?? 0,
        w: s[`${prefix}wins_bedwars`] ?? 0,
        l: s[`${prefix}losses_bedwars`] ?? 0,
        fk: s[`${prefix}final_kills_bedwars`] ?? 0,
        fd: s[`${prefix}final_deaths_bedwars`] ?? 0,
        bb: s[`${prefix}beds_broken_bedwars`] ?? 0,
        bl: s[`${prefix}beds_lost_bedwars`] ?? 0,
    };
}

function formatCompare(label: string, a: BwSnapshot, b: BwSnapshot): string {
    return (
        `[${label}] ${a.name} ${bwStar(a.lvl)} vs ${b.name} ${bwStar(b.lvl)} | ` +
        `FK ${a.fk}/${b.fk} | ` +
        `FKDR ${ratio(a.fk, a.fd)}/${ratio(b.fk, b.fd)} | ` +
        `BBLR ${ratio(a.bb, a.bl)}/${ratio(b.bb, b.bl)} | ` +
        `W ${a.w}/${b.w} | ` +
        `WLR ${ratio(a.w, a.l)}/${ratio(b.w, b.l)} | ${hex()}`
    );
}

// ── BW mode prefix map (matches stats module) ────────────────────────────────

const BW_MODES: Record<string, { label: string; prefix: string }> = {
    overall: { label: 'BWvs', prefix: '' },
    solo: { label: 'BWvs Solo', prefix: 'eight_one_' },
    doubles: { label: 'BWvs 2s', prefix: 'eight_two_' },
    threes: { label: 'BWvs 3s', prefix: 'four_three_' },
    fours: { label: 'BWvs 4s', prefix: 'four_four_' },
    '4v4': { label: 'BWvs 4v4', prefix: 'two_four_' },
};

function modeFromAlias(alias: string | undefined): { label: string; prefix: string } {
    if (!alias) return BW_MODES.overall!;
    const a = alias.toLowerCase();
    if (['solo', '1s', 'solos'].includes(a)) return BW_MODES.solo!;
    if (['doubles', '2s', 'duos'].includes(a)) return BW_MODES.doubles!;
    if (['threes', '3s', '3v3', 'trios'].includes(a)) return BW_MODES.threes!;
    if (['fours', '4s', '4v4v4v4', 'quads'].includes(a)) return BW_MODES.fours!;
    if (a === '4v4') return BW_MODES['4v4']!;
    return BW_MODES.overall!;
}

// ── Handler ──────────────────────────────────────────────────────────────────

async function runCompare(
    ctx: CommandContext,
    bridge: Bridge,
    cmdId: string,
    p1: string,
    p2: string,
    mode: { label: string; prefix: string }
): Promise<void> {
    const remaining = cooldowns.isOnCooldown(ctx.username, ctx.guildRank, cmdId);
    if (remaining > 0) {
        bridge.bot.chat(ctx.replyChannel, `${ctx.username}, cooldown: ${remaining}s`);
        return;
    }
    const [a, b] = await Promise.all([
        resolveBw(p1, bridge, ctx.replyChannel),
        resolveBw(p2, bridge, ctx.replyChannel),
    ]);
    if (!a || !b) return;
    const msg = formatCompare(
        mode.label,
        snapshot(a.name, a.player, mode.prefix),
        snapshot(b.name, b.player, mode.prefix)
    );
    bridge.bot.chat(ctx.replyChannel, msg);
    cooldowns.setCooldown(ctx.username, cmdId, ctx.guildRank);
}

export function registerCompareModule(commands: ModuleCommand[]): void {
    // !bwvs <p1> <p2>  or  !bwvs <mode> <p1> <p2>
    // Mode aliases must match stats module aliases.
    const MODE_ALIASES =
        '(?:solo|1s|solos|doubles|2s|duos|threes|3s|3v3|trios|fours|4s|4v4v4v4|quads|4v4)';

    commands.push({
        commandId: 'compare:bwvs:mode',
        pattern: new RegExp(`^!bwvs\\s+(${MODE_ALIASES})\\s+(\\S+)\\s+(\\S+)\\s*$`, 'i'),
        async handler(ctx, bridge) {
            const mode = modeFromAlias(ctx.matches[1]);
            await runCompare(
                ctx,
                bridge,
                'compare:bwvs',
                ctx.matches[2]!,
                ctx.matches[3]!,
                mode
            );
        },
    });

    commands.push({
        commandId: 'compare:bwvs',
        pattern: /^!bwvs\s+(\S+)\s+(\S+)\s*$/i,
        async handler(ctx, bridge) {
            await runCompare(
                ctx,
                bridge,
                'compare:bwvs',
                ctx.matches[1]!,
                ctx.matches[2]!,
                BW_MODES.overall!
            );
        },
    });

    // !bw <p1> vs <p2>  and  !bw <mode> <p1> vs <p2>
    // Registered BEFORE the stats !bw catch-all so it wins dispatch (modules
    // are registered in this order in src/modules/index.ts).
    commands.push({
        commandId: 'compare:bw-vs:mode',
        pattern: new RegExp(`^!bw\\s+(${MODE_ALIASES})\\s+(\\S+)\\s+vs\\s+(\\S+)\\s*$`, 'i'),
        async handler(ctx, bridge) {
            const mode = modeFromAlias(ctx.matches[1]);
            await runCompare(
                ctx,
                bridge,
                'compare:bwvs',
                ctx.matches[2]!,
                ctx.matches[3]!,
                mode
            );
        },
    });

    commands.push({
        commandId: 'compare:bw-vs',
        pattern: /^!bw\s+(\S+)\s+vs\s+(\S+)\s*$/i,
        async handler(ctx, bridge) {
            await runCompare(
                ctx,
                bridge,
                'compare:bwvs',
                ctx.matches[1]!,
                ctx.matches[2]!,
                BW_MODES.overall!
            );
        },
    });
}
