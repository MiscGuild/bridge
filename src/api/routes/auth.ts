import { Router } from 'express';
import jwt from 'jsonwebtoken';
import env from '@/config/env';

const router = Router();

// Simple API key → JWT exchange
router.post('/token', (req, res) => {
    const { api_key } = req.body as { api_key?: string };
    if (!env.API_KEY || api_key !== env.API_KEY) {
        res.status(401).json({ error: 'Invalid API key' });
        return;
    }
    const token = jwt.sign({ sub: 'api', admin: true }, env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
});

export default router;
