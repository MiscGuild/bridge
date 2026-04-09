import { Router } from 'express';
import type { AuthRequest } from '@/api/middleware/auth';
import { formatDuration } from '@/util/formatting';
import { getHealth } from '@/monitoring/health';

const router = Router();

router.get('/', (req: AuthRequest, res) => {
    const bridge = req.bridge!;
    const health = getHealth(bridge);

    res.json({
        ...health,
        uptime: formatDuration(bridge.uptime),
        minecraft: {
            state: bridge.bot.state,
            online: bridge.onlineCount,
            total: bridge.totalCount,
        },
    });
});

export default router;
