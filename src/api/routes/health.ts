import { Router } from 'express';
import type { AuthRequest } from '@/api/middleware/auth';
import { formatDuration } from '@/util/formatting';

const router = Router();

router.get('/', (req: AuthRequest, res) => {
    const bridge = req.bridge!;
    const uptimeMs = bridge.uptime;

    res.json({
        status: 'ok',
        uptime: formatDuration(uptimeMs),
        uptimeMs,
        minecraft: {
            state: bridge.bot.state,
            online: bridge.onlineCount,
            total: bridge.totalCount,
        },
        discord: {
            connected: bridge.discord.isReady(),
            ping: bridge.discord.ws.ping,
        },
        memory: {
            heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
        timestamp: new Date().toISOString(),
    });
});

export default router;
