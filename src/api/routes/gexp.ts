import { Router } from 'express';
import type { AuthRequest } from '@/api/middleware/auth';
import { gexpHistoryRepo } from '@/db/repositories/gexp-history.repo';
import { mojangService } from '@/services/mojang';

const router = Router();

/** GET /gexp/player/:username?days=7 — Player GEXP history */
router.get('/player/:username', async (req: AuthRequest, res) => {
    const username = req.params['username'] as string;
    const days = Math.min(Number(req.query['days'] ?? 7), 30);

    const profile = await mojangService.getProfile(username).catch(() => null);
    if (!profile) {
        res.status(404).json({ error: `Player not found: ${username}` });
        return;
    }

    const startDate = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const endDate = new Date().toISOString().slice(0, 10);
    const history = await gexpHistoryRepo.getPlayerHistory(profile.id, startDate, endDate);
    const total = history.reduce((sum, r) => sum + r.gexp_earned, 0);

    res.json({ username: profile.name, uuid: profile.id, days, total, history });
});

/** GET /gexp/leaderboard?days=7&limit=20 — Guild leaderboard */
router.get('/leaderboard', async (req: AuthRequest, res) => {
    const days = Math.min(Number(req.query['days'] ?? 7), 30);
    const limit = Math.min(Number(req.query['limit'] ?? 20), 50);

    const startDate = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const endDate = new Date().toISOString().slice(0, 10);
    const entries = await gexpHistoryRepo.getLeaderboard(startDate, endDate, limit);
    const guildTotal = entries.reduce((sum, e) => sum + e.total, 0);

    res.json({ days, guildTotal, entries });
});

/** GET /gexp/daily/:date — All members for a specific date */
router.get('/daily/:date', async (req: AuthRequest, res) => {
    const date = req.params['date'] as string;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({ error: 'Date must be YYYY-MM-DD' });
        return;
    }
    const records = await gexpHistoryRepo.getDay(date);
    const total = records.reduce((sum, r) => sum + r.gexp_earned, 0);

    res.json({ date, total, members: records });
});

export default router;
