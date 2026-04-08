import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '@/config/env';

export interface AuthRequest extends Request {
    userId?: string;
    isAdmin?: boolean;
    bridge?: import('@/bridge/bridge').default;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    // API key auth
    const apiKey = req.headers['x-api-key'] as string | undefined;
    if (env.API_KEY && apiKey === env.API_KEY) {
        req.isAdmin = true;
        return next();
    }

    // JWT Bearer auth
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; admin?: boolean };
            req.userId = payload.sub;
            req.isAdmin = payload.admin === true;
            return next();
        } catch {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
    }

    // If no API_KEY configured, allow all (dev mode)
    if (!env.API_KEY) {
        req.isAdmin = true;
        return next();
    }

    res.status(401).json({ error: 'Authentication required' });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.isAdmin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
}
