import type Bridge from '@/bridge/bridge';
import {
    BW_MODE_ALIASES,
    bwModeFromAlias,
    bwStar,
    bwStats,
    resolvePlayer,
    type BwStats,
} from '@/modules/stats/shared';
import type { CommandContext, ModuleCommand } from '@/modules/types';
import cooldowns, { replyIfOnCooldown } from '@/util/cooldown';
import { randomHex, ratio } from '@/util/formatting';

/** All compare variants share one cooldown. */
const COOLDOWN_ID = 'compare:bwvs';

type NamedBwStats = BwStats & { name: string };

function formatCompare(label: string, a: NamedBwStats, b: NamedBwStats): string {
    return (
        `[${label}] ${a.name} ${bwStar(a.lvl)} vs ${b.name} ${bwStar(b.lvl)} | ` +
        `FK ${a.fk}/${b.fk} | ` +
        `FKDR ${ratio(a.fk, a.fd)}/${ratio(b.fk, b.fd)} | ` +
        `BBLR ${ratio(a.bb, a.bl)}/${ratio(b.bb, b.bl)} | ` +
        `W ${a.w}/${b.w} | ` +
        `WLR ${ratio(a.w, a.l)}/${ratio(b.w, b.l)} | ${randomHex()}`
    );
}

/** Compare two players' BedWars stats, overall or for the mode named by `modeAlias`. */
async function runCompare(
    ctx: CommandContext,
    bridge: Bridge,
    p1: string,
    p2: string,
    modeAlias?: string
): Promise<void> {
    if (replyIfOnCooldown(ctx, bridge, COOLDOWN_ID)) return;

    const [a, b] = await Promise.all([
        resolvePlayer(p1, bridge, ctx.replyChannel),
        resolvePlayer(p2, bridge, ctx.replyChannel),
    ]);
    if (!a || !b) return;

    const mode = modeAlias ? bwModeFromAlias(modeAlias) : undefined;
    const prefix = mode?.prefix ?? '';
    const msg = formatCompare(
        mode ? `BWvs ${mode.label}` : 'BWvs',
        { name: a.name, ...bwStats(a.player, prefix) },
        { name: b.name, ...bwStats(b.player, prefix) }
    );
    bridge.bot.chat(ctx.replyChannel, msg);
    cooldowns.setCooldown(ctx.username, COOLDOWN_ID, ctx.guildRank);
}

export function registerCompareModule(commands: ModuleCommand[]): void {
    commands.push(
        // !bwvs <mode> <p1> <p2>
        {
            commandId: 'compare:bwvs:mode',
            pattern: new RegExp(`^!bwvs\\s+(${BW_MODE_ALIASES})\\s+(\\S+)\\s+(\\S+)\\s*$`, 'i'),
            handler: (ctx, bridge) =>
                runCompare(ctx, bridge, ctx.matches[2]!, ctx.matches[3]!, ctx.matches[1]),
        },
        // !bwvs <p1> <p2>
        {
            commandId: 'compare:bwvs',
            pattern: /^!bwvs\s+(\S+)\s+(\S+)\s*$/i,
            handler: (ctx, bridge) => runCompare(ctx, bridge, ctx.matches[1]!, ctx.matches[2]!),
        },
        // !bw <mode> <p1> vs <p2>
        {
            commandId: 'compare:bw-vs:mode',
            pattern: new RegExp(`^!bw\\s+(${BW_MODE_ALIASES})\\s+(\\S+)\\s+vs\\s+(\\S+)\\s*$`, 'i'),
            handler: (ctx, bridge) =>
                runCompare(ctx, bridge, ctx.matches[2]!, ctx.matches[3]!, ctx.matches[1]),
        },
        // !bw <p1> vs <p2>
        {
            commandId: 'compare:bw-vs',
            pattern: /^!bw\s+(\S+)\s+vs\s+(\S+)\s*$/i,
            handler: (ctx, bridge) => runCompare(ctx, bridge, ctx.matches[1]!, ctx.matches[2]!),
        }
    );
}
