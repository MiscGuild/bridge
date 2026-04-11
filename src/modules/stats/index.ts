import type Bridge from '@/bridge/bridge';
import type { ModuleCommand } from '@/modules/types';
import { hypixelService } from '@/services/hypixel';
import { mojangService } from '@/services/mojang';
import cooldowns from '@/util/cooldown';

// ── Utility helpers ───────────────────────────────────────────────────────────

function ratio(a: number, b: number): string {
    if (b === 0) return a > 0 ? String(a) : '0';
    return (a / b).toFixed(2);
}

function hex(): string {
    return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
}

function fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
}

function bwStar(level: number): string {
    const sym = level >= 1000 ? '✫' : '✪';
    return `[${level}${sym}]`;
}

function swLevel(exp: number): number {
    // Cumulative XP thresholds for levels 1-20 (from Hypixel wiki, Apr 2025)
    const thresholds = [
        0, 10, 35, 75, 125, 250, 500, 1000, 1750, 2750,
        4000, 5550, 7300, 9300, 11800, 14800, 18300, 22300, 26800, 31800,
    ];
    if (exp >= 31800) return 20 + Math.floor((exp - 31800) / 5000);
    for (let i = thresholds.length - 1; i >= 0; i--) { if (exp >= thresholds[i]!) return i + 1; }
    return 1;
}

function swStar(level: number): string {
    return level >= 5 ? `[${level}✪]` : `[${level}]`;
}

function sbSkillLevel(xp: number): number {
    const table = [0,50,175,375,675,1175,1925,2925,4425,6425,9925,14925,22425,32425,47425,67425,97425,147425,222425,322425,522425,822425,1222425,1722425,2322425,3022425,3822425,4722425,5722425,6822425,8022425,9322425,10722425,13822425,15522425,17322425,19222425,21222425,23322425,25522425,27822425,30222425,32722425,35322425,38072425,40972425,44072425,47472425,51172425,55172425,59472425,64072425,68972425,74172425,79672425,85472425,91572425,97972425,104672425,111672425];
    for (let i = table.length - 1; i >= 0; i--) { if (xp >= table[i]!) return i; }
    return 0;
}

async function resolve(username: string, bridge: Bridge): Promise<{ uuid: string; name: string; player: any } | null> {
    const profile = await mojangService.getProfile(username);
    if (!profile) { bridge.bot.chat('gc', `Could not find player: ${username}`); return null; }
    const player = await hypixelService.getPlayer(profile.id);
    if (!player) { bridge.bot.chat('gc', `Could not fetch Hypixel data for ${username}`); return null; }
    return { uuid: profile.id, name: profile.name, player };
}

// ── Bedwars ───────────────────────────────────────────────────────────────────

function bwMode(label: string, p: string, name: string, player: any): string {
    const ach = player.achievements ?? {};
    const s = (player.stats?.Bedwars as Record<string, number>) ?? {};
    const lvl = ach.bedwars_level ?? 0;
    const w = s[`${p}wins_bedwars`] ?? 0;
    const l = s[`${p}losses_bedwars`] ?? 0;
    const fk = s[`${p}final_kills_bedwars`] ?? 0;
    const fd = s[`${p}final_deaths_bedwars`] ?? 0;
    const bb = s[`${p}beds_broken_bedwars`] ?? 0;
    const bl = s[`${p}beds_lost_bedwars`] ?? 0;
    return `[${label}] ${bwStar(lvl)} ${name} | W: ${w} | FK: ${fk} | FKDR: ${ratio(fk, fd)} | BBLR: ${ratio(bb, bl)} | WLR: ${ratio(w, l)} | ${hex()}`;
}

function buildBwOverall(name: string, player: any): string {
    return bwMode('BW', '', name, player);
}
function buildBwSolo(name: string, player: any): string {
    return bwMode('BW Solo', 'eight_one_', name, player);
}
function buildBwDoubles(name: string, player: any): string {
    return bwMode('BW 2s', 'eight_two_', name, player);
}
function buildBwThrees(name: string, player: any): string {
    return bwMode('BW 3s', 'four_three_', name, player);
}
function buildBwFours(name: string, player: any): string {
    return bwMode('BW 4s', 'four_four_', name, player);
}
function buildBw4v4(name: string, player: any): string {
    return bwMode('BW 4v4', 'two_four_', name, player);
}

// ── SkyWars ───────────────────────────────────────────────────────────────────

function buildSkywars(name: string, player: any): string {
    const s = (player.stats?.SkyWars as Record<string, number | string>) ?? {};
    const exp = Number(s.skywars_experience ?? s.experience ?? 0);
    const lvl = exp > 0 ? swLevel(exp) : Number(s.level ?? player.achievements?.skywars_level ?? 0);
    const w = Number(s.wins ?? 0), l = Number(s.losses ?? 0);
    const k = Number(s.kills ?? 0), d = Number(s.deaths ?? 0);
    const souls = Number(s.souls ?? 0);
    return `[SW] ${swStar(lvl)} ${name} | W: ${w} | K: ${fmt(k)} | KDR: ${ratio(k, d)} | WLR: ${ratio(w, l)} | Souls: ${fmt(souls)} | ${hex()}`;
}

// ── Duels ─────────────────────────────────────────────────────────────────────

function duelsMsg(label: string, name: string, s: Record<string, number>, wKey: string, lKey: string): string {
    const w = s[wKey] ?? 0, l = s[lKey] ?? 0;
    const k = s.kills ?? 0, d = s.deaths ?? 0;
    return `[${label}] ${name} | W: ${w} | K: ${fmt(k)} | KDR: ${ratio(k, d)} | WLR: ${ratio(w, l)} | ${hex()}`;
}

function buildDuels(name: string, player: any): string {
    const s = (player.stats?.Duels as Record<string, number>) ?? {};
    return duelsMsg('Duels', name, s, 'wins', 'losses');
}
function buildUhcDuels(name: string, player: any): string {
    return duelsMsg('UHC Duels', name, (player.stats?.Duels ?? {}) as any, 'uhc_duel_wins', 'uhc_duel_losses');
}
function buildSwDuels(name: string, player: any): string {
    return duelsMsg('SW Duels', name, (player.stats?.Duels ?? {}) as any, 'sw_duel_wins', 'sw_duel_losses');
}
function buildClassicDuels(name: string, player: any): string {
    return duelsMsg('Classic Duels', name, (player.stats?.Duels ?? {}) as any, 'classic_duel_wins', 'classic_duel_losses');
}
function buildBowDuels(name: string, player: any): string {
    return duelsMsg('Bow Duels', name, (player.stats?.Duels ?? {}) as any, 'bow_wins', 'bow_losses');
}
function buildOpDuels(name: string, player: any): string {
    return duelsMsg('OP Duels', name, (player.stats?.Duels ?? {}) as any, 'op_duel_wins', 'op_duel_losses');
}
function buildComboDuels(name: string, player: any): string {
    return duelsMsg('Combo Duels', name, (player.stats?.Duels ?? {}) as any, 'combo_duel_wins', 'combo_duel_losses');
}
function buildPotionDuels(name: string, player: any): string {
    return duelsMsg('Potion Duels', name, (player.stats?.Duels ?? {}) as any, 'potion_duel_wins', 'potion_duel_losses');
}

// ── UHC Champions ─────────────────────────────────────────────────────────────

function buildUhc(name: string, player: any): string {
    const s = (player.stats?.UHC as Record<string, number>) ?? {};
    return `[UHC] ${name} | W: ${s.wins ?? 0} | K: ${fmt(s.kills ?? 0)} | KDR: ${ratio(s.kills ?? 0, s.deaths ?? 0)} | ${hex()}`;
}

// ── Murder Mystery ────────────────────────────────────────────────────────────

function buildMM(name: string, player: any): string {
    const s = (player.stats?.MurderMystery as Record<string, number>) ?? {};
    const w = s.wins ?? 0;
    return `[MM] ${name} | W: ${w} | Kills: ${s.murderer_kills ?? 0} | Detective W: ${s.detective_wins ?? 0} | ${hex()}`;
}

// ── Build Battle ──────────────────────────────────────────────────────────────

function buildBB(name: string, player: any): string {
    const s = (player.stats?.BuildBattle as Record<string, number>) ?? {};
    return `[BB] ${name} | W: ${s.wins ?? 0} | Score: ${fmt(s.score ?? 0)} | ${hex()}`;
}

// ── Arcade ────────────────────────────────────────────────────────────────────

function buildArcade(name: string, player: any): string {
    const s = (player.stats?.Arcade as Record<string, number>) ?? {};
    return `[Arcade] ${name} | W: ${s.wins ?? 0} | Coins: ${fmt(s.coins ?? 0)} | ${hex()}`;
}

// ── TNT Games ─────────────────────────────────────────────────────────────────

function buildTnt(name: string, player: any): string {
    const s = (player.stats?.TNTGames as Record<string, number>) ?? {};
    return `[TNT] ${name} | W: ${s.wins ?? 0} | K: ${s.kills ?? 0} | ${hex()}`;
}

// ── Cops and Crims ────────────────────────────────────────────────────────────

function buildCvc(name: string, player: any): string {
    const s = (player.stats?.MCGO as Record<string, number>) ?? {};
    const k = s.kills ?? 0, d = s.deaths ?? 0, w = s.game_wins ?? 0;
    return `[CvC] ${name} | W: ${w} | K: ${fmt(k)} | KDR: ${ratio(k, d)} | Rounds: ${s.round_wins ?? 0} | ${hex()}`;
}

// ── Mega Walls ────────────────────────────────────────────────────────────────

function buildMW(name: string, player: any): string {
    const s = (player.stats?.Walls3 as Record<string, any>) ?? {};
    const k = s.kills ?? 0, d = s.deaths ?? 0, fk = s.final_kills ?? 0, fd = s.final_deaths ?? 0;
    const w = s.wins ?? 0, l = s.losses ?? 0;
    return `[MW] ${name} | W: ${w} | KDR: ${ratio(k, d)} | FKDR: ${ratio(fk, fd)} | FK: ${fk} | Class: ${s.chosen_class ?? '?'} | WLR: ${ratio(w, l)} | ${hex()}`;
}

// ── Pit ───────────────────────────────────────────────────────────────────────

function buildPit(name: string, player: any): string {
    const s = (player.stats?.Pit as Record<string, any>) ?? {};
    const p = s.profile ?? {};
    const k = p.kills ?? 0, d = p.deaths ?? 0;
    return `[Pit] ${name} | Prestige: ${p.prestige ?? 0} | Lvl: ${p.level ?? 0} | K: ${fmt(k)} | KDR: ${ratio(k, d)} | Gold: ${fmt(p.cash ?? 0)} | ${hex()}`;
}

// ── GEXP ──────────────────────────────────────────────────────────────────────

function buildGexp(name: string, player: any, guild: any): string {
    if (!guild) return `${name} is not in a guild.`;
    const member = guild.members?.find((m: any) => m.uuid === player.uuid);
    if (!member) return `${name} is not in your tracked guild.`;
    const history: Record<string, number> = member.expHistory ?? {};
    const entries = Object.entries(history).sort(([a], [b]) => b.localeCompare(a));
    const weeklyTotal = entries.slice(0, 7).reduce((sum, [, v]) => sum + v, 0);
    const today = entries[0]?.[1] ?? 0;
    return `[GEXP] ${name} | Today: ${fmt(today)} | Week: ${fmt(weeklyTotal)} | ${hex()}`;
}

// ── SkyBlock ──────────────────────────────────────────────────────────────────

async function fetchSkyblockData(uuid: string): Promise<any | null> {
    try {
        const profiles = await hypixelService.getSkyblockProfiles(uuid) as any[];
        if (!profiles || profiles.length === 0) return null;
        const selected = profiles.find((p: any) => p.selected) ?? profiles[0];
        if (!selected?.members?.[uuid]) return null;
        return {
            memberData: selected.members[uuid],
            bankBalance: selected.banking?.balance ?? 0,
            profileName: selected.cute_name ?? 'Unknown',
        };
    } catch { return null; }
}

function buildSbOverview(name: string, _player: any, sbData: any): string {
    if (!sbData) return `No SkyBlock data found for ${name}. | ${hex()}`;
    const m = sbData.memberData;
    const skillData = m?.leveling?.experience ?? m?.player_data?.experience ?? {};
    const skills = ['SKILL_FARMING','SKILL_MINING','SKILL_COMBAT','SKILL_FORAGING','SKILL_FISHING','SKILL_ENCHANTING','SKILL_ALCHEMY','SKILL_TAMING'];
    const levels = skills.map(sk => sbSkillLevel(skillData[sk] ?? 0));
    const avg = levels.reduce((a: number, b: number) => a + b, 0) / levels.length;
    const purse = m?.currencies?.coin_purse ?? 0;
    const sbLvl = Math.floor((m?.leveling?.experience ?? 0) / 100);
    return `[SB] ${name} | Lvl: ${sbLvl} | Avg Skill: ${avg.toFixed(1)} | Purse: ${fmt(Math.floor(purse))} | Bank: ${fmt(Math.floor(sbData.bankBalance))} | ${hex()}`;
}

function buildSbSkills(name: string, _player: any, sbData: any): string {
    if (!sbData) return `No SkyBlock data for ${name}. | ${hex()}`;
    const m = sbData.memberData;
    const sd = m?.leveling?.experience ?? m?.player_data?.experience ?? {};
    const sk = (key: string) => sbSkillLevel(sd[key] ?? 0);
    return `[SB Skills] ${name} | Farm: ${sk('SKILL_FARMING')} | Mine: ${sk('SKILL_MINING')} | Combat: ${sk('SKILL_COMBAT')} | Fish: ${sk('SKILL_FISHING')} | Ench: ${sk('SKILL_ENCHANTING')} | Alch: ${sk('SKILL_ALCHEMY')} | ${hex()}`;
}

function buildSbSlayers(name: string, _player: any, sbData: any): string {
    if (!sbData) return `No SkyBlock data for ${name}. | ${hex()}`;
    const slayers = sbData.memberData?.slayer?.slayer_bosses ?? {};
    const xp = (boss: string) => slayers[boss]?.xp ?? 0;
    return `[SB Slayers] ${name} | Rev: ${fmt(xp('zombie'))} | Tara: ${fmt(xp('spider'))} | Sven: ${fmt(xp('wolf'))} | Eman: ${fmt(xp('enderman'))} | Blaze: ${fmt(xp('blaze'))} | ${hex()}`;
}

function buildSbDungeons(name: string, _player: any, sbData: any): string {
    if (!sbData) return `No SkyBlock data for ${name}. | ${hex()}`;
    const d = sbData.memberData?.dungeons?.dungeon_types?.catacombs ?? {};
    const catXp = d.experience ?? 0;
    const catLvl = sbSkillLevel(catXp);
    const completions = Object.values(d.tier_completions ?? {} as Record<string, number>).reduce((a: number, b: any) => a + Number(b), 0);
    return `[SB Dungeons] ${name} | Cata Lvl: ${catLvl} | Completions: ${completions} | ${hex()}`;
}

// ── Command factory ───────────────────────────────────────────────────────────

function makeStatCmd(
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
            if (remaining > 0) { bridge.bot.chat('gc', `${ctx.username}, cooldown: ${remaining}s`); return; }
            const result = await resolve(target, bridge);
            if (!result) return;
            const extra = extraFn ? await extraFn(result.uuid, bridge) : undefined;
            const msg = buildMsg(result.name, result.player, extra);
            bridge.bot.chat('gc', msg);
            cooldowns.setCooldown(ctx.username, cmdId, ctx.guildRank);
        },
    };
}

export function registerStatsModule(commands: ModuleCommand[]): void {
    // BW sub-modes must be registered BEFORE the overall !bw catch-all
    commands.push(
        makeStatCmd('stats:bw:solo', /^!bw\s+(?:solo|1s|solos)\s*(\S+)?$/i, buildBwSolo),
        makeStatCmd('stats:bw:doubles', /^!bw\s+(?:doubles|2s|duos)\s*(\S+)?$/i, buildBwDoubles),
        makeStatCmd('stats:bw:threes', /^!bw\s+(?:threes|3s|3v3|trios)\s*(\S+)?$/i, buildBwThrees),
        makeStatCmd('stats:bw:fours', /^!bw\s+(?:fours|4s|4v4v4v4|quads)\s*(\S+)?$/i, buildBwFours),
        makeStatCmd('stats:bw:4v4', /^!bw\s+4v4\s*(\S+)?$/i, buildBw4v4),
        makeStatCmd('stats:bw', /^!bw(?:\s+(\S+))?$/i, buildBwOverall),
    );

    // SkyWars
    commands.push(makeStatCmd('stats:sw', /^!sw(?:\s+(\S+))?$/i, buildSkywars));

    // Duels — overall + 7 sub-modes
    commands.push(
        makeStatCmd('stats:duels', /^!duels(?:\s+(\S+))?$/i, buildDuels),
        makeStatCmd('stats:uhcduels', /^!uhcduels(?:\s+(\S+))?$/i, buildUhcDuels),
        makeStatCmd('stats:swduels', /^!swduels(?:\s+(\S+))?$/i, buildSwDuels),
        makeStatCmd('stats:classicduels', /^!classicduels(?:\s+(\S+))?$/i, buildClassicDuels),
        makeStatCmd('stats:bowduels', /^!bowduels(?:\s+(\S+))?$/i, buildBowDuels),
        makeStatCmd('stats:opduels', /^!opduels(?:\s+(\S+))?$/i, buildOpDuels),
        makeStatCmd('stats:comboduels', /^!comboduels(?:\s+(\S+))?$/i, buildComboDuels),
        makeStatCmd('stats:potionduels', /^!potionduels(?:\s+(\S+))?$/i, buildPotionDuels),
    );

    // Other game modes
    commands.push(
        makeStatCmd('stats:uhc', /^!uhc(?:\s+(\S+))?$/i, buildUhc),
        makeStatCmd('stats:mm', /^!mm(?:\s+(\S+))?$/i, buildMM),
        makeStatCmd('stats:bb', /^!bb(?:\s+(\S+))?$/i, buildBB),
        makeStatCmd('stats:arcade', /^!arcade(?:\s+(\S+))?$/i, buildArcade),
        makeStatCmd('stats:tnt', /^!tnt(?:\s+(\S+))?$/i, buildTnt),
        makeStatCmd('stats:cvc', /^!cvc(?:\s+(\S+))?$/i, buildCvc),
        makeStatCmd('stats:mw', /^!mw(?:\s+(\S+))?$/i, buildMW),
        makeStatCmd('stats:pit', /^!pit(?:\s+(\S+))?$/i, buildPit),
    );

    // GEXP
    commands.push(
        makeStatCmd('stats:gexp', /^!gexp(?:\s+(\S+))?$/i, buildGexp as any, async (uuid) => hypixelService.getGuild(uuid)),
    );

    // SkyBlock commands
    commands.push(
        makeStatCmd('stats:sb:skills', /^!(?:sb\s+)?skills(?:\s+(\S+))?$/i, buildSbSkills, fetchSkyblockData),
        makeStatCmd('stats:sb:slayers', /^!(?:sb\s+)?slayers(?:\s+(\S+))?$/i, buildSbSlayers, fetchSkyblockData),
        makeStatCmd('stats:sb:dungeons', /^!(?:sb\s+)?dungeons(?:\s+(\S+))?$/i, buildSbDungeons, fetchSkyblockData),
        makeStatCmd('stats:sb', /^!sb(?:\s+(\S+))?$/i, buildSbOverview, fetchSkyblockData),
    );
}
