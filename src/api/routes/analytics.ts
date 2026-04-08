import { Router } from 'express';
import type { AuthRequest } from '@/api/middleware/auth';
import { analyticsRepo } from '@/db/repositories/analytics.repo';

const router = Router();

router.get('/', async (req: AuthRequest, res) => {
    const period = (req.query['period'] as string) ?? 'weekly';
    const now = new Date();
    const end = now.toISOString().slice(0, 10);

    let daysBack = 7;
    if (period === 'monthly') daysBack = 30;
    else if (period === 'daily') daysBack = 1;

    const start = new Date(Date.now() - daysBack * 86400000).toISOString().slice(0, 10);
    const data = await analyticsRepo.getRange(start, end);
    res.json({ period, start, end, data });
});

router.get('/chatters', async (req: AuthRequest, res) => {
    const date = (req.query['date'] as string) ?? new Date().toISOString().slice(0, 10);
    const limit = Math.min(Number(req.query['limit'] ?? 10), 50);
    const chatters = await analyticsRepo.getTopChatters(date, limit);
    res.json({ date, chatters });
});

export default router;
