import { consola } from 'consola';
import { MC_CHAT_RATE_MS, MAX_QUEUE_SIZE } from '@/config/constants';

type SendFn = (message: string) => void;

interface QueueItem {
    message: string;
    resolve: () => void;
}

/** Unicode zero-width spaces used to salt duplicate messages */
const SALTS = ['\u200b', '\u200c', '\u200d', '\ufeff'];

export class MessageQueue {
    private queue: QueueItem[] = [];
    private processing = false;
    private lastSent = 0;
    private lastSentMessage = '';
    private saltIndex = 0;
    private sendFn: SendFn | null = null;
    private paused = false;
    private resumeWaiters: (() => void)[] = [];

    setSendFn(fn: SendFn) {
        this.sendFn = fn;
    }

    /**
     * Pause queue processing. New messages may still be enqueued, but nothing
     * will be sent until {@link resume} is called. Used to give priority work
     * (e.g. blacklist kicks) exclusive access to the chat send function.
     */
    pause(): void {
        this.paused = true;
    }

    /** Resume processing previously paused by {@link pause}. */
    resume(): void {
        if (!this.paused) return;
        this.paused = false;
        const waiters = this.resumeWaiters.splice(0);
        for (const w of waiters) w();
        this.process();
    }

    /** Direct send that bypasses the queue entirely. Caller is responsible for rate limits. */
    sendDirect(message: string): void {
        if (!this.sendFn) return;
        try {
            this.sendFn(message);
            this.lastSent = Date.now();
            this.lastSentMessage = message;
        } catch (err) {
            consola.error('MessageQueue sendDirect error:', err);
        }
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
            // If paused, wait until resumed before sending the next message.
            if (this.paused) {
                await new Promise<void>((r) => this.resumeWaiters.push(r));
                continue;
            }

            const now = Date.now();
            const elapsed = now - this.lastSent;
            if (elapsed < MC_CHAT_RATE_MS) {
                await new Promise((r) => setTimeout(r, MC_CHAT_RATE_MS - elapsed));
            }

            const item = this.queue.shift();
            if (!item) break;

            // Auto-salt consecutive identical messages so Hypixel never blocks them
            let outgoing = item.message;
            if (outgoing === this.lastSentMessage) {
                const salt = SALTS[this.saltIndex % SALTS.length]!;
                this.saltIndex = (this.saltIndex + 1) % SALTS.length;
                outgoing = outgoing + salt;
            } else {
                this.saltIndex = 0;
            }

            try {
                this.sendFn(outgoing);
                this.lastSent = Date.now();
                this.lastSentMessage = outgoing;
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
        this.lastSentMessage = '';
    }
}

export default new MessageQueue();
