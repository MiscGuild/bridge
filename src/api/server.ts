import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { consola } from 'consola';
import env from '@/config/env';
import { API_PREFIX } from '@/config/constants';
import { authMiddleware } from './middleware/auth';

// Routes
import healthRouter from './routes/health';
import guildRouter from './routes/guild';
import statsRouter from './routes/stats';
import moderationRouter from './routes/moderation';
import blacklistRouter from './routes/blacklist';
import analyticsRouter from './routes/analytics';
import sessionsRouter from './routes/sessions';
import webhooksRouter from './routes/webhooks';
import authRouter from './routes/auth';
import gexpRouter from './routes/gexp';

export function createApiServer(bridge: import('@/bridge/bridge').default) {
    const app = express();

    app.use(helmet());
    app.use(cors());
    app.use(express.json());

    // Global rate limit
    app.use(rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));

    // Attach bridge to req
    app.use((req: any, _res, next) => {
        req.bridge = bridge;
        next();
    });

    // Public routes
    app.use(`${API_PREFIX}/health`, healthRouter);
    app.use(`${API_PREFIX}/auth`, authRouter);

    // Protected routes (require API key or session)
    app.use(`${API_PREFIX}/guild`, authMiddleware, guildRouter);
    app.use(`${API_PREFIX}/stats`, authMiddleware, statsRouter);
    app.use(`${API_PREFIX}/moderation`, authMiddleware, moderationRouter);
    app.use(`${API_PREFIX}/blacklist`, authMiddleware, blacklistRouter);
    app.use(`${API_PREFIX}/analytics`, authMiddleware, analyticsRouter);
    app.use(`${API_PREFIX}/sessions`, authMiddleware, sessionsRouter);
    app.use(`${API_PREFIX}/webhooks`, authMiddleware, webhooksRouter);
    app.use(`${API_PREFIX}/gexp`, authMiddleware, gexpRouter);

    // Global error handler
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        consola.error('API error:', err);
        res.status(500).json({ error: 'Internal server error' });
    });

    return {
        start(): Promise<void> {
            return new Promise((resolve) => {
                app.listen(env.API_PORT, () => {
                    consola.success(`API server listening on port ${env.API_PORT}`);
                    resolve();
                });
            });
        },
        app,
    };
}
