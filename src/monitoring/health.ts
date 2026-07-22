import { consola } from 'consola';
import env from '@/config/env';
import type Bridge from '@/bridge/bridge';

export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    bot: {
        state: string;
        limboAttempts: number;
        minecraftOk: boolean;
    };
    discord: {
        ready: boolean;
        ping?: number;
    };
    memory: {
        rss: number;
        heapUsed: number;
        heapTotal: number;
    };
    metrics: {
        messagesIn: number;
        messagesOut: number;
        commandsHandled: number;
        errors: number;
        rateLimitHits: number;
    };
    checkedAt: string;
}

/** Rolling counters — reset every 24h */
const metrics = {
    messagesIn: 0,
    messagesOut: 0,
    commandsHandled: 0,
    errors: 0,
    rateLimitHits: 0,
};

export function incrementMetric(key: keyof typeof metrics): void {
    metrics[key]++;
}

const startedAt = Date.now();

/**
 * Long-running bridge MC health: bot must be sitting in Hypixel limbo.
 * `connected` (lobby/game) is not healthy — limbo recovery should run first.
 */
export function isMinecraftHealthy(bridge: Bridge): boolean {
    return bridge.bot.state === 'limbo';
}

export function getHealth(bridge: Bridge): HealthStatus {
    const mem = process.memoryUsage();
    const botOk = isMinecraftHealthy(bridge);
    const discordOk = bridge.discord.isReady();

    const status: HealthStatus['status'] =
        botOk && discordOk ? 'healthy' : !botOk && !discordOk ? 'down' : 'degraded';

    return {
        status,
        uptime: Math.floor((Date.now() - startedAt) / 1000),
        bot: {
            state: bridge.bot.state,
            limboAttempts: bridge.bot.limboAttempts,
            minecraftOk: botOk,
        },
        discord: {
            ready: discordOk,
            ping: discordOk ? bridge.discord.ws.ping : undefined,
        },
        memory: {
            rss: Math.round(mem.rss / 1024 / 1024),
            heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        },
        metrics: { ...metrics },
        checkedAt: new Date().toISOString(),
    };
}

/** Periodically log health info, alert Discord, and relogin MC when stuck unhealthy */
export function startHealthMonitor(bridge: Bridge): void {
    // Reset counters at midnight
    const resetAtMidnight = () => {
        const now = new Date();
        const next = new Date(now);
        next.setUTCHours(24, 0, 0, 0);
        setTimeout(() => {
            metrics.messagesIn = 0;
            metrics.messagesOut = 0;
            metrics.commandsHandled = 0;
            metrics.errors = 0;
            metrics.rateLimitHits = 0;
            resetAtMidnight();
        }, next.getTime() - now.getTime());
    };
    resetAtMidnight();

    // Log health every 5 minutes
    setInterval(
        () => {
            const h = getHealth(bridge);
            if (h.status === 'healthy') {
                consola.info(
                    `[Health] ${h.status} | uptime: ${h.uptime}s | mem: ${h.memory.heapUsed}MB | msgs: ${h.metrics.messagesIn}in/${h.metrics.messagesOut}out`
                );
            } else {
                consola.warn(
                    `[Health] ${h.status} | bot: ${h.bot.state} | discord: ${h.discord.ready}`
                );
            }
        },
        5 * 60 * 1000
    );

    // Alert Discord if overall health is bad for > 2 min
    let alertedAt = 0;
    setInterval(
        async () => {
            const h = getHealth(bridge);
            if (h.status !== 'healthy' && Date.now() - alertedAt > 10 * 60 * 1000) {
                alertedAt = Date.now();
                await bridge.discord
                    .send(
                        'gc',
                        `**Health Alert** — status: **${h.status}** | bot: \`${h.bot.state}\` | discord: \`${h.discord.ready}\``
                    )
                    .catch(() => {});
            }
        },
        2 * 60 * 1000
    );

    startMinecraftReloginWatchdog(bridge);
}

/**
 * Prefer limbo as the healthy MC state.
 * - While `connected` (not limbo): run limbo recovery first; only relogin after grace.
 * - While disconnected/connecting: existing grace → relogin path.
 */
function startMinecraftReloginWatchdog(bridge: Bridge): void {
    if (!env.MINECRAFT_HEALTH_RELOGIN_ENABLED) {
        consola.info('[Health] MC health relogin disabled');
        return;
    }

    const graceMs = env.MINECRAFT_HEALTH_RELOGIN_GRACE_MINUTES * 60 * 1000;
    const connectedGraceMs = env.MINECRAFT_LIMBO_CONNECTED_GRACE_SECONDS * 1000;
    const cooldownMs = env.MINECRAFT_HEALTH_RELOGIN_COOLDOWN_MINUTES * 60 * 1000;
    const resetMs = env.MINECRAFT_HEALTH_RELOGIN_RESET_MINUTES * 60 * 1000;
    const maxAttempts = env.MINECRAFT_HEALTH_RELOGIN_MAX_ATTEMPTS;

    let unhealthySince: number | null = null;
    let lastReloginAt = 0;
    let attemptCount = 0;
    let healthySince: number | null = Date.now();

    // Check every 30s — cheap and responsive vs grace/cooldown measured in minutes
    setInterval(async () => {
        if (bridge.bot.isShuttingDown) return;

        const state = bridge.bot.state;
        const now = Date.now();

        if (state === 'limbo') {
            unhealthySince = null;
            if (healthySince === null) healthySince = now;
            // After sustained healthy period, reset the attempt counter
            if (attemptCount > 0 && now - healthySince >= resetMs) {
                consola.info(
                    `[Health] MC healthy (limbo) for ${env.MINECRAFT_HEALTH_RELOGIN_RESET_MINUTES}m — resetting relogin attempts`
                );
                attemptCount = 0;
            }
            return;
        }

        healthySince = null;

        // Connected but not in limbo: recover via /limbo before considering relogin
        if (state === 'connected') {
            bridge.bot.ensureInLimbo('health');
        }

        if (unhealthySince === null) unhealthySince = now;
        const unhealthyFor = now - unhealthySince;

        // Connected uses a shorter grace (limbo retries run during it).
        // Disconnected/connecting uses the broader health grace.
        const escalateAfterMs = state === 'connected' ? connectedGraceMs : graceMs;
        if (unhealthyFor < escalateAfterMs) return;

        // Already reconnecting via kick/end/limbo-exhaustion path — don't pile on
        if (bridge.bot.isReconnectPending) {
            consola.debug('[Health] MC unhealthy but reconnect already pending');
            return;
        }

        if (attemptCount >= maxAttempts) {
            consola.error(
                `[Health] MC unhealthy (${state}) but max relogin attempts (${maxAttempts}) reached — manual intervention needed`
            );
            return;
        }

        if (now - lastReloginAt < cooldownMs) return;

        attemptCount++;
        lastReloginAt = now;
        const reason = `health:${state}`;

        consola.warn(
            `[Health] MC unhealthy for ${Math.round(unhealthyFor / 1000)}s (state=${state}) — relogin attempt ${attemptCount}/${maxAttempts}`
        );

        await bridge.discord
            .send(
                'oc',
                `**MC Relogin** — bot stuck \`${state}\` for ~${Math.round(unhealthyFor / 60000)}m. Attempting reconnect (${attemptCount}/${maxAttempts})...`
            )
            .catch(() => {});

        const started = bridge.requestRelogin(reason);
        if (!started) {
            // Roll back attempt if we couldn't start (e.g. shutdown raced)
            attemptCount = Math.max(0, attemptCount - 1);
            lastReloginAt = 0;
        } else {
            // Give the new session a fresh grace window after we kick off reconnect
            unhealthySince = now;
        }
    }, 30 * 1000);

    consola.info(
        `[Health] MC relogin watchdog on (limbo-required, connectedGrace=${env.MINECRAFT_LIMBO_CONNECTED_GRACE_SECONDS}s, grace=${env.MINECRAFT_HEALTH_RELOGIN_GRACE_MINUTES}m, cooldown=${env.MINECRAFT_HEALTH_RELOGIN_COOLDOWN_MINUTES}m, max=${maxAttempts})`
    );
}
