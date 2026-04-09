import type Bridge from '@/bridge/bridge';
import type { ModuleCommand } from '@/modules/types';
import { hypixelService } from '@/services/hypixel';
import { mojangService } from '@/services/mojang';
import cooldowns from '@/util/cooldown';

function ratio(a: number, b: number): string {
    if (b === 0) return a > 0 ? String(a) : '0';
    return (a / b).toFixed(2);
}

function hex(): string {
    return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
}

async function resolve(
    username: string,
    bridge: Bridge
): Promise<{ uuid: string; name: string; player: NonNullable<ReturnType<typeof hypixelService.getPlayer>> extends Promise<infer T> ? T : never } | null> {
    const profile = await mojangService.getProfile(username);
    if (!profile) {
        bridge.bot.chat('gc', `Could not find player: ${username}`);
        return null;
    }
    const player = await hypixelService.getPlayer(profile.id);
    if (!player) {
        bridge.bot.chat('gc', `Could not fetch Hypixel data for ${username}`);
        return null;
    }
    return { uuid: profile.id, name: profile.name, player: player as any };
}

// ─── Bedwars ─────────────────────────────────────────────────────────────────

function buildBedwarsMessage(name: string, player: any): string {
    const ach = player.achievements ?? {};
    const s = (player.stats?.Bedwars as Record<string, number>) ?? {};
    const lvl = ach.bedwars_level ?? 0;

    const totalWins = s.wins_bedwars ?? 0;
    const totalLosses = s.losses_bedwars ?? 0;
    const fk = s.final_kills_bedwars ?? 0;
    const fd = s.final_deaths_bedwars ?? 0;
    const bb = s.beds_broken_bedwars ?? 0;
    const bl = s.beds_lost_bedwars ?? 0;

    return `[BW] ✦${lvl} ${name} | W: ${totalWins} | FK: ${fk} | FKDR: ${ratio(fk, fd)} | BBLR: ${ratio(bb, bl)} | WLR: ${ratio(totalWins, totalLosses)} | ${hex()}`;
}

// ─── SkyWars ─────────────────────────────────────────────────────────────────

function calcSwLevel(exp: number): number {
    const levels = [0,20,70,150,250,500,1000,2000,3500,6000,10000,15000];
    let level = 1;
    for (let i = 0; i < levels.length; i++) {
        if (exp >= levels[i]!) level = i + 1;
    }
    return level > 12 ? Math.floor(12 + (exp - 15000) / 10000) : level;
}

function buildSkywarsMessage(name: string, player: any): string {
    const s = (player.stats?.SkyWars as Record<string, number | string>) ?? {};
    const exp = Number(s.skywars_experience ?? 0);
    const lvl = exp > 0 ? calcSwLevel(exp) : Number(s.level ?? player.achievements?.skywars_level ?? 0);
    const wins = Number(s.wins ?? 0);
    const losses = Number(s.losses ?? 0);
    const kills = Number(s.kills ?? 0);
    const deaths = Number(s.deaths ?? 0);
    return `[SW] ✦${lvl} ${name} | W: ${wins} | K: ${kills} | KDR: ${ratio(kills, deaths)} | WLR: ${ratio(wins, losses)} | ${hex()}`;
}

// ─── Duels ───────────────────────────────────────────────────────────────────

function buildDuelsMessage(name: string, player: any): string {
    const s = (player.stats?.Duels as Record<string, number>) ?? {};
    const wins = s.wins ?? 0;
    const losses = s.losses ?? 0;
    const kills = s.kills ?? 0;
    const deaths = s.deaths ?? 0;
    return `[Duels] ${name} | W: ${wins} | K: ${kills} | KDR: ${ratio(kills, deaths)} | WLR: ${ratio(wins, losses)} | ${hex()}`;
}

// ─── GEXP ────────────────────────────────────────────────────────────────────

function buildGexpMessage(name: string, player: any, guild: any): string {
    if (!guild) return `${name} is not in a guild.`;

    const member = guild.members?.find((m: any) => m.uuid === player.uuid);
    if (!member) return `${name} is not in your tracked guild.`;

    const history: Record<string, number> = member.expHistory ?? {};
    const entries = Object.entries(history).sort(([a], [b]) => b.localeCompare(a));
    const weeklyTotal = entries.slice(0, 7).reduce((sum, [, v]) => sum + v, 0);
    const today = entries[0]?.[1] ?? 0;

    return `[GEXP] ${name} | Today: ${today.toLocaleString()} | Week: ${weeklyTotal.toLocaleString()} | ${hex()}`;
}

// ─── UHC ─────────────────────────────────────────────────────────────────────

function buildUhcMessage(name: string, player: any): string {
    const s = (player.stats?.UHC as Record<string, number>) ?? {};
    const wins = s.wins ?? 0;
    const kills = s.kills ?? 0;
    const deaths = s.deaths ?? 0;
    return `[UHC] ${name} | W: ${wins} | K: ${kills} | KDR: ${ratio(kills, deaths)} | ${hex()}`;
}

// ─── Murder Mystery ───────────────────────────────────────────────────────────

function buildMurderMysteryMessage(name: string, player: any): string {
    const s = (player.stats?.MurderMystery as Record<string, number>) ?? {};
    const wins = s.wins ?? 0;
    const kills = s.murderer_kills ?? 0;
    const detectiveWins = s.detective_wins ?? 0;
    return `[MM] ${name} | W: ${wins} | Killer Wins: ${(wins - detectiveWins)} | Kills: ${kills} | ${hex()}`;
}

// ─── Build Battle ─────────────────────────────────────────────────────────────

function buildBuildBattleMessage(name: string, player: any): string {
    const s = (player.stats?.BuildBattle as Record<string, number>) ?? {};
    const wins = s.wins ?? 0;
    const score = s.score ?? 0;
    return `[BB] ${name} | W: ${wins} | Score: ${score.toLocaleString()} | ${hex()}`;
}

// ─── Arcade ────────────────────────────────────────────────────────────────────

function buildArcadeMessage(name: string, player: any): string {
    const s = (player.stats?.Arcade as Record<string, number>) ?? {};
    const coins = s.coins ?? 0;
    const wins = s.wins ?? 0;
    return `[Arcade] ${name} | W: ${wins} | Coins: ${coins.toLocaleString()} | ${hex()}`;
}

// ─── TNT Games ────────────────────────────────────────────────────────────────

function buildTntMessage(name: string, player: any): string {
    const s = (player.stats?.TNTGames as Record<string, number>) ?? {};
    const wins = s.wins ?? 0;
    const kills = s.kills ?? 0;
    return `[TNT] ${name} | W: ${wins} | K: ${kills} | ${hex()}`;
}

// ─── Command factory ──────────────────────────────────────────────────────────

function makeStatCommand(
    cmdId: string,
    pattern: RegExp,
    buildMsg: (name: string, player: any, extra?: any) => string,
    extraFn?: (uuid: string, bridge: Bridge) => Promise<any>
): ModuleCommand {
    return {
        commandId: cmdId,
        pattern,
        async handler(ctx, bridge) {
            const target = ctx.matches[1]?.trim() ?? ctx.username;

            const remaining = cooldowns.isOnCooldown(ctx.username, ctx.guildRank, cmdId);
            if (remaining > 0) {
                bridge.bot.chat('gc', `${ctx.username}, you're on cooldown! Wait ${remaining}s.`);
                return;
            }

            const result = await resolve(target, bridge);
            if (!result) return;

            let extra: any;
            if (extraFn) extra = await extraFn(result.uuid, bridge);

            const msg = buildMsg(result.name, result.player, extra);
            bridge.bot.chat('gc', msg);

            cooldowns.setCooldown(ctx.username, cmdId, ctx.guildRank);
        },
    };
}

export function registerStatsModule(commands: ModuleCommand[]): void {
    commands.push(
        makeStatCommand('stats:bw', /^!bw(?:\s+(\S+))?$/i, buildBedwarsMessage),
        makeStatCommand('stats:sw', /^!sw(?:\s+(\S+))?$/i, buildSkywarsMessage),
        makeStatCommand('stats:duels', /^!duels(?:\s+(\S+))?$/i, buildDuelsMessage),
        makeStatCommand('stats:uhc', /^!uhc(?:\s+(\S+))?$/i, buildUhcMessage),
        makeStatCommand('stats:mm', /^!mm(?:\s+(\S+))?$/i, buildMurderMysteryMessage),
        makeStatCommand('stats:bb', /^!bb(?:\s+(\S+))?$/i, buildBuildBattleMessage),
        makeStatCommand('stats:arcade', /^!arcade(?:\s+(\S+))?$/i, buildArcadeMessage),
        makeStatCommand('stats:tnt', /^!tnt(?:\s+(\S+))?$/i, buildTntMessage),
        makeStatCommand(
            'stats:gexp',
            /^!gexp(?:\s+(\S+))?$/i,
            buildGexpMessage as any,
            async (uuid, bridge) => {
                const guild = await hypixelService.getGuild(uuid);
                return guild;
            }
        )
    );
}
