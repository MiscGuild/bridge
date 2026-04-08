import { consola } from 'consola';
import { MC_CHAT_RATE_MS, MAX_QUEUE_SIZE } from '@/config/constants';

type SendFn = (message: string) => void;

interface QueueItem {
    message: string;
    resolve: () => void;
}

export class MessageQueue {
    private queue: QueueItem[] = [];
    private processing = false;
    private lastSent = 0;
    private sendFn: SendFn | null = null;

    setSendFn(fn: SendFn) {
        this.sendFn = fn;
    }

    async enqueue(message: string): Promise<void> {
        if (this.queue.length >= MAX_QUEUE_SIZE) {
            consola.warn(`Message queue full (${MAX_QUEUE_SIZE}), dropping: ${message}`);
            return;
        }

        return new Promise((resolve) => {
            this.queue.push({ message, resolve });
            this.process();
        });
    }

    private async process(): Promise<void> {
        if (this.processing || !this.sendFn) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const now = Date.now();
            const elapsed = now - this.lastSent;
            if (elapsed < MC_CHAT_RATE_MS) {
                await new Promise((r) => setTimeout(r, MC_CHAT_RATE_MS - elapsed));
            }

            const item = this.queue.shift();
            if (!item) break;

            try {
                this.sendFn(item.message);
                this.lastSent = Date.now();
            } catch (err) {
                consola.error('MessageQueue send error:', err);
            }

            item.resolve();
        }

        this.processing = false;
    }

    get size(): number {
        return this.queue.length;
    }

    clear(): void {
        this.queue = [];
    }
}

export default new MessageQueue();
