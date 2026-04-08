import { Router } from 'express';
import type { AuthRequest } from '@/api/middleware/auth';
import { hypixelService } from '@/services/hypixel';
import { mojangService } from '@/services/mojang';

const router = Router();

router.get('/:username/:game', async (req: AuthRequest, res) => {
    const username = req.params['username'] as string;
    const game = req.params['game'] as string;

    const profile = await mojangService.getProfile(username);
    if (!profile) {
        return res.status(404).json({ error: 'Player not found' });
    }

    const player = await hypixelService.getPlayer(profile.id);
    if (!player) {
        return res.status(404).json({ error: 'Hypixel profile not found' });
    }

    const stats = (player.stats as Record<string, unknown>)?.[game.toLowerCase()] ?? null;
    return res.json({ username: player.displayname, uuid: profile.id, game, stats });
});

export default router;
