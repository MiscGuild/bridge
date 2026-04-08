import { RANK_COLORS, DEFAULT_EMBED_COLOR } from '@/config/constants';

export function getRankColor(rank?: string): number {
    if (!rank) return DEFAULT_EMBED_COLOR;
    return RANK_COLORS[rank] ?? DEFAULT_EMBED_COLOR;
}

export function escapeMarkdown(text: string): string {
    return text.replace(/[_*~`|\\]/g, '\\$&');
}

export function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

export function formatKdr(kills: number, deaths: number): string {
    if (deaths === 0) return kills.toString();
    return (kills / deaths).toFixed(2);
}

export function formatWlr(wins: number, losses: number): string {
    if (losses === 0) return wins.toString();
    return (wins / losses).toFixed(2);
}

export function padCenter(text: string, char = '-', width = 54): string {
    const pad = char.repeat(width);
    return `${pad}\n${text}\n${pad}`;
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
