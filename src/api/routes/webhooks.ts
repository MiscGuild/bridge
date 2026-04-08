import { Router } from 'express';
import type { AuthRequest } from '@/api/middleware/auth';
import { webhooksRepo, CreateWebhookInput } from '@/db/repositories/webhooks.repo';
import { requireAdmin } from '@/api/middleware/auth';

const router = Router();

router.get('/', async (_req: AuthRequest, res) => {
    const hooks = await webhooksRepo.getAll();
    res.json({ webhooks: hooks });
});

router.post('/', requireAdmin, async (req: AuthRequest, res) => {
    const input: CreateWebhookInput = req.body;
    const hook = await webhooksRepo.create(input);
    if (!hook) return res.status(503).json({ error: 'Database unavailable' });
    return res.status(201).json({ webhook: hook });
});

router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
    await webhooksRepo.deactivate(req.params['id'] as string);
    res.json({ success: true });
});

export default router;
