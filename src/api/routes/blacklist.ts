import { Router } from 'express';
import type { AuthRequest } from '@/api/middleware/auth';
import { blacklistRepo, CreateBlacklistInput } from '@/db/repositories/blacklist.repo';
import { auditLogRepo } from '@/db/repositories/audit-log.repo';
import { requireAdmin } from '@/api/middleware/auth';

const router = Router();

router.get('/', async (_req: AuthRequest, res) => {
    const entries = await blacklistRepo.getAll();
    res.json({ entries });
});

router.post('/', requireAdmin, async (req: AuthRequest, res) => {
    const input: CreateBlacklistInput = req.body;
    const entry = await blacklistRepo.create(input);
    if (!entry) return res.status(503).json({ error: 'Database unavailable' });
    await auditLogRepo.log(req.userId ?? 'api', 'blacklist_add', input.uuid, input as unknown as Record<string, unknown>);
    return res.status(201).json({ entry });
});

router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
    const id = req.params['id'] as string;
    await blacklistRepo.deactivate(id);
    await auditLogRepo.log(req.userId ?? 'api', 'blacklist_remove', id);
    res.json({ success: true });
});

export default router;
