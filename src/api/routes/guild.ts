import { Router } from 'express';
import type { AuthRequest } from '@/api/middleware/auth';
import env from '@/config/env';

const router = Router();

router.get('/', async (req: AuthRequest, res) => {
    const bridge = req.bridge!;
    res.json({
        onlineCount: bridge.onlineCount,
        totalCount: bridge.totalCount,
        name: env.HYPIXEL_GUILD_NAME,
    });
});

router.get('/online', (req: AuthRequest, res) => {
    const bridge = req.bridge!;
    res.json({ online: bridge.onlineCount - 1, total: bridge.totalCount });
});

export default router;
