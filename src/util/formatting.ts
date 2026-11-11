import { RANK_COLORS, DEFAULT_EMBED_COLOR } from '@/config/constants';

export function getRankColor(rank?: string): number {
    if (!rank) return DEFAULT_EMBED_COLOR;
    return RANK_COLORS[rank] ?? DEFAULT_EMBED_COLOR;
}

export function escapeMarkdown(text: string): string {
    return text.replace(/[_*~`|\\]/g, '\\$&');
}

export function formatDuration(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

/**
 * A random hex colour code such as `#3fa2c1`. Appended to in-game replies so Hypixel
 * never rejects a repeated reply as "the same message twice".
 */
export function randomHex(): string {
    return `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0')}`;
}

/** `a / b` to two decimals (K/D, W/L…). When `b` is 0 the ratio is just `a`. */
export function ratio(a: number, b: number): string {
    if (b === 0) return a > 0 ? String(a) : '0';
    return (a / b).toFixed(2);
}

/** 1234 → "1.2K", 2500000 → "2.5M" (or "2.50M" with `millionDecimals = 2`). */
export function compactNumber(n: number, millionDecimals = 1): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(millionDecimals) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
}

/** Discord timestamp markup, shown in each viewer's own timezone (`f` = date, `R` = relative). */
export function discordTimestamp(date: Date | string, style: 'f' | 'R' = 'f'): string {
    return `<t:${Math.floor(new Date(date).getTime() / 1000)}:${style}>`;
}
