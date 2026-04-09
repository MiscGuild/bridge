import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';

export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    bot: {
        state: string;
        limboAttempts: number;
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

export function getHealth(bridge: Bridge): HealthStatus {
    const mem = process.memoryUsage();
    const botOk = bridge.bot.state === 'connected' || bridge.bot.state === 'limbo';
    const discordOk = bridge.discord.isReady();

    const status: HealthStatus['status'] =
        botOk && discordOk ? 'healthy' : !botOk && !discordOk ? 'down' : 'degraded';

    return {
        status,
        uptime: Math.floor((Date.now() - startedAt) / 1000),
        bot: {
            state: bridge.bot.state,
            limboAttempts: bridge.bot.limboAttempts,
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

/** Periodically log health info and send alerts if degraded */
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
    setInterval(() => {
        const h = getHealth(bridge);
        if (h.status === 'healthy') {
            consola.info(`[Health] ${h.status} | uptime: ${h.uptime}s | mem: ${h.memory.heapUsed}MB | msgs: ${h.metrics.messagesIn}in/${h.metrics.messagesOut}out`);
        } else {
            consola.warn(`[Health] ${h.status} | bot: ${h.bot.state} | discord: ${h.discord.ready}`);
        }
    }, 5 * 60 * 1000);

    // Alert Discord if bot state is bad for > 2 min
    let alertedAt = 0;
    setInterval(async () => {
        const h = getHealth(bridge);
        if (h.status !== 'healthy' && Date.now() - alertedAt > 10 * 60 * 1000) {
            alertedAt = Date.now();
            await bridge.discord.send(
                'gc',
                `⚠️ **Health Alert** — status: **${h.status}** | bot: \`${h.bot.state}\` | discord: \`${h.discord.ready}\``
            ).catch(() => {});
        }
    }, 2 * 60 * 1000);
}
