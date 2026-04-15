import { Router } from 'express';
import type { AuthRequest } from '@/api/middleware/auth';
import { bansRepo, CreateBanInput } from '@/db/repositories/bans.repo';
import { auditLogRepo } from '@/db/repositories/audit-log.repo';
import { requireAdmin } from '@/api/middleware/auth';

const router = Router();

router.get('/bans', async (req: AuthRequest, res) => {
    const bans = await bansRepo.getActive();
    res.json({ bans });
});

router.post('/bans', requireAdmin, async (req: AuthRequest, res) => {
    const input: CreateBanInput = req.body;
    const ban = await bansRepo.create(input);
    if (!ban) return res.status(503).json({ error: 'Database unavailable' });
    await auditLogRepo.log(
        req.userId ?? 'api',
        'ban_create',
        input.uuid,
        input as unknown as Record<string, unknown>
    );
    return res.status(201).json({ ban });
});

router.delete('/bans/:id', requireAdmin, async (req: AuthRequest, res) => {
    const id = req.params['id'] as string;
    await bansRepo.deactivate(id);
    await auditLogRepo.log(req.userId ?? 'api', 'ban_remove', id);
    res.json({ success: true });
});

router.get('/audit-log', async (req: AuthRequest, res) => {
    const limit = Math.min(Number(req.query['limit'] ?? 50), 200);
    const entries = await auditLogRepo.getRecent(limit);
    res.json({ entries });
});

export default router;
