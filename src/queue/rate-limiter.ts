/** Per-user token bucket rate limiter */
interface Bucket {
    tokens: number;
    lastRefill: number;
}

export interface RateLimiterOptions {
    /** Max tokens per bucket */
    capacity: number;
    /** Tokens added per refillInterval */
    refillRate: number;
    /** Milliseconds between refills */
    refillInterval: number;
}

export class RateLimiter {
    private buckets = new Map<string, Bucket>();
    private readonly capacity: number;
    private readonly refillRate: number;
    private readonly refillInterval: number;

    constructor(opts: RateLimiterOptions) {
        this.capacity = opts.capacity;
        this.refillRate = opts.refillRate;
        this.refillInterval = opts.refillInterval;

        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /** Returns true if allowed, false if rate limited */
    consume(key: string, tokens = 1): boolean {
        let bucket = this.buckets.get(key);

        if (!bucket) {
            bucket = { tokens: this.capacity, lastRefill: Date.now() };
            this.buckets.set(key, bucket);
        }

        this.refill(bucket);

        if (bucket.tokens < tokens) return false;
        bucket.tokens -= tokens;
        return true;
    }

    private refill(bucket: Bucket): void {
        const now = Date.now();
        const intervals = Math.floor((now - bucket.lastRefill) / this.refillInterval);
        if (intervals > 0) {
            bucket.tokens = Math.min(this.capacity, bucket.tokens + intervals * this.refillRate);
            bucket.lastRefill = now;
        }
    }

    private cleanup(): void {
        const cutoff = Date.now() - 10 * 60 * 1000;
        for (const [k, v] of this.buckets) {
            if (v.lastRefill < cutoff) this.buckets.delete(k);
        }
    }
}

export default new RateLimiter({ capacity: 5, refillRate: 1, refillInterval: 2000 });
