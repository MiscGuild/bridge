import type Bridge from '@/bridge/bridge';
import type { ModuleCommand } from '@/modules/types';
import { hypixelService } from '@/services/hypixel';
import { mojangService } from '@/services/mojang';
import { sessionsRepo } from '@/db/repositories/sessions.repo';

interface GameStats {
    bw_wins?: number;
    bw_losses?: number;
    bw_final_kills?: number;
    bw_final_deaths?: number;
    bw_beds_broken?: number;
    bw_beds_lost?: number;
    sw_wins?: number;
    sw_losses?: number;
    sw_kills?: number;
    sw_deaths?: number;
    cvc_wins?: number;
    cvc_kills?: number;
    cvc_deaths?: number;
}

interface ActiveSession {
    uuid: string;
    username: string;
    game: 'bw' | 'sw' | 'cvc';
    startTime: number;
    startStats: GameStats;
}

const activeSessions = new Map<string, ActiveSession>(); // key: `${uuid}:${game}`

async function fetchStats(uuid: string, game: 'bw' | 'sw' | 'cvc'): Promise<GameStats | null> {
    const player = await hypixelService.getPlayer(uuid);
    if (!player || !player.stats) return null;

    if (game === 'bw') {
        const s = (player.stats.Bedwars as Record<string, number>) ?? {};
        return {
            bw_wins: s.wins_bedwars,
            bw_losses: s.losses_bedwars,
            bw_final_kills: s.final_kills_bedwars,
            bw_final_deaths: s.final_deaths_bedwars,
            bw_beds_broken: s.beds_broken_bedwars,
            bw_beds_lost: s.beds_lost_bedwars,
        };
    } else if (game === 'sw') {
        const s = (player.stats.SkyWars as Record<string, number>) ?? {};
        return {
            sw_wins: s.wins,
            sw_losses: s.losses,
            sw_kills: s.kills,
            sw_deaths: s.deaths,
        };
    } else {
        const s = (player.stats.MCGO as Record<string, number>) ?? {};
        return {
            cvc_wins: s.game_wins,
            cvc_kills: s.kills,
            cvc_deaths: s.deaths,
            cvc_headshot_kills: s.headshot_kills,
        } as any;
    }
}

function formatDiff(start: GameStats, end: GameStats, game: 'bw' | 'sw' | 'cvc'): string {
    if (game === 'bw') {
        const wins = (end.bw_wins ?? 0) - (start.bw_wins ?? 0);
        const fk = (end.bw_final_kills ?? 0) - (start.bw_final_kills ?? 0);
        const fd = (end.bw_final_deaths ?? 0) - (start.bw_final_deaths ?? 0);
        const bb = (end.bw_beds_broken ?? 0) - (start.bw_beds_broken ?? 0);
        const fkdr = fd === 0 ? (fk > 0 ? String(fk) : '0') : (fk / fd).toFixed(2);
        return `+W: ${wins} | +FK: ${fk} | FKDR: ${fkdr} | +BB: ${bb}`;
    } else if (game === 'sw') {
        const wins = (end.sw_wins ?? 0) - (start.sw_wins ?? 0);
        const kills = (end.sw_kills ?? 0) - (start.sw_kills ?? 0);
        const deaths = (end.sw_deaths ?? 0) - (start.sw_deaths ?? 0);
        const kdr = deaths === 0 ? (kills > 0 ? String(kills) : '0') : (kills / deaths).toFixed(2);
        return `+W: ${wins} | +K: ${kills} | KDR: ${kdr}`;
    } else {
        const wins = (end.cvc_wins ?? 0) - (start.cvc_wins ?? 0);
        const kills = (end.cvc_kills ?? 0) - (start.cvc_kills ?? 0);
        const deaths = (end.cvc_deaths ?? 0) - (start.cvc_deaths ?? 0);
        const kdr = deaths === 0 ? (kills > 0 ? String(kills) : '0') : (kills / deaths).toFixed(2);
        return `+W: ${wins} | +K: ${kills} | KDR: ${kdr}`;
    }
}

function humanDuration(ms: number): string {
    const secs = Math.floor(ms / 1000);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

async function handleStart(game: 'bw' | 'sw' | 'cvc', ctx: { username: string; guildRank?: string }, bridge: Bridge): Promise<void> {
    const profile = await mojangService.getProfile(ctx.username);
    if (!profile) {
        bridge.bot.chat('gc', `Could not find your Minecraft profile!`);
        return;
    }

    const key = `${profile.id}:${game}`;
    if (activeSessions.has(key)) {
        bridge.bot.chat('gc', `${ctx.username}, you already have an active ${game.toUpperCase()} session!`);
        return;
    }

    // Invalidate cache to ensure fresh stats
    hypixelService.clearCache(profile.id);
    const startStats = await fetchStats(profile.id, game);
    if (!startStats) {
        bridge.bot.chat('gc', `Could not fetch your stats. Try again?`);
        return;
    }

    activeSessions.set(key, { uuid: profile.id, username: ctx.username, game, startTime: Date.now(), startStats });
    bridge.bot.chat('gc', `${ctx.username}, ${game.toUpperCase()} session started! Good luck!`);
}

async function handleStop(game: 'bw' | 'sw' | 'cvc', ctx: { username: string }, bridge: Bridge): Promise<void> {
    const profile = await mojangService.getProfile(ctx.username);
    if (!profile) {
        bridge.bot.chat('gc', `Could not find your Minecraft profile!`);
        return;
    }

    const key = `${profile.id}:${game}`;
    const session = activeSessions.get(key);
    if (!session) {
        bridge.bot.chat('gc', `${ctx.username}, you don't have an active ${game.toUpperCase()} session.`);
        return;
    }

    hypixelService.clearCache(profile.id);
    const endStats = await fetchStats(profile.id, game);
    if (!endStats) {
        bridge.bot.chat('gc', `Could not fetch your stats. Session not ended.`);
        return;
    }

    activeSessions.delete(key);
    const duration = humanDuration(Date.now() - session.startTime);
    const diff = formatDiff(session.startStats, endStats, game);

    bridge.bot.chat('gc', `[Session] ${ctx.username} ${game.toUpperCase()} (${duration}): ${diff}`);

    // Persist to Supabase
    sessionsRepo.create({
        user_uuid: profile.id,
        username: ctx.username,
        game_mode: game,
        start_stats: session.startStats as Record<string, unknown>,
    }).then((record) => {
        if (!record) return;
        return sessionsRepo.complete(record.id, endStats as Record<string, unknown>, {});
    }).catch(() => {/* Supabase optional */});
}

async function handleShow(game: 'bw' | 'sw' | 'cvc', ctx: { username: string }, bridge: Bridge): Promise<void> {
    const profile = await mojangService.getProfile(ctx.username);
    if (!profile) {
        bridge.bot.chat('gc', `Could not find your profile!`);
        return;
    }

    const key = `${profile.id}:${game}`;
    const session = activeSessions.get(key);
    if (!session) {
        bridge.bot.chat('gc', `${ctx.username}, no active ${game.toUpperCase()} session.`);
        return;
    }

    hypixelService.clearCache(profile.id);
    const current = await fetchStats(profile.id, game);
    if (!current) {
        bridge.bot.chat('gc', `Could not fetch current stats.`);
        return;
    }

    const elapsed = humanDuration(Date.now() - session.startTime);
    const diff = formatDiff(session.startStats, current, game);
    bridge.bot.chat('gc', `[Session] ${ctx.username} ${game.toUpperCase()} (${elapsed}): ${diff}`);
}

export function registerSessionsModule(commands: ModuleCommand[]): void {
    for (const game of ['bw', 'sw', 'cvc'] as const) {
        const g = game;
        commands.push(
            {
                commandId: `session:${g}:start`,
                pattern: new RegExp(`^!session\\s+${g}\\s+start`, 'i'),
                handler: (ctx, bridge) => handleStart(g, ctx, bridge),
            },
            {
                commandId: `session:${g}:stop`,
                pattern: new RegExp(`^!session\\s+${g}\\s+stop`, 'i'),
                handler: (ctx, bridge) => handleStop(g, ctx, bridge),
            },
            {
                commandId: `session:${g}:show`,
                pattern: new RegExp(`^!session\\s+${g}(?:\\s|$)`, 'i'),
                handler: (ctx, bridge) => handleShow(g, ctx, bridge),
            }
        );
    }
}

export { activeSessions };
