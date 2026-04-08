import { Router } from 'express';
import type { AuthRequest } from '@/api/middleware/auth';
import { sessionsRepo } from '@/db/repositories/sessions.repo';

const router = Router();

router.get('/', async (req: AuthRequest, res) => {
    const username = req.query['username'] as string | undefined;
    const limit = Math.min(Number(req.query['limit'] ?? 20), 100);

    if (username) {
        const history = await sessionsRepo.getHistory(username, limit);
        return res.json({ sessions: history });
    }
    return res.status(400).json({ error: 'username query param required' });
});

router.post('/expire', async (_req: AuthRequest, res) => {
    await sessionsRepo.expireStale();
    res.json({ success: true });
});

export default router;
