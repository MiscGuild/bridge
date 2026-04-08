import { createHmac } from 'crypto';
import { consola } from 'consola';
import { webhooksRepo } from '@/db/repositories/webhooks.repo';

export interface WebhookPayload {
    event: string;
    timestamp: string;
    data: Record<string, unknown>;
}

async function dispatchToUrl(
    url: string,
    payload: WebhookPayload,
    secret: string | null,
    retries = 3
): Promise<void> {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'GuildBridgeBot/3.0',
    };

    if (secret) {
        const sig = createHmac('sha256', secret).update(body).digest('hex');
        headers['X-Bridge-Signature'] = `sha256=${sig}`;
    }

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const res = await fetch(url, { method: 'POST', headers, body });
            if (res.ok) return;

            if (res.status >= 400 && res.status < 500) {
                consola.warn(`Webhook ${url} returned ${res.status} — not retrying`);
                return;
            }
        } catch (err) {
            if (attempt === retries - 1) {
                consola.error(`Webhook dispatch to ${url} failed after ${retries} attempts:`, err);
                return;
            }
        }
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
    }
}

export const webhookService = {
    async dispatch(eventName: string, data: Record<string, unknown>): Promise<void> {
        const hooks = await webhooksRepo.getForEvent(eventName);
        if (hooks.length === 0) return;

        const payload: WebhookPayload = {
            event: eventName,
            timestamp: new Date().toISOString(),
            data,
        };

        await Promise.allSettled(
            hooks.map((hook) => dispatchToUrl(hook.url, payload, hook.secret))
        );
    },
};
