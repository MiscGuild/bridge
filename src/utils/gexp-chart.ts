import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import type { ChartConfiguration } from 'chart.js';

const WIDTH = 800;
const HEIGHT = 400;

const renderer = new ChartJSNodeCanvas({
    width: WIDTH,
    height: HEIGHT,
    backgroundColour: '#2b2d31',
});

/** Format numbers with k/m suffixes */
function fmtNum(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toString();
}

/** Format date "2025-04-13" → "Apr 13" */
function fmtDate(d: string): string {
    const [, month, day] = d.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month!, 10) - 1]} ${parseInt(day!, 10)}`;
}

export interface GexpDataPoint {
    date: string;
    gexp: number;
}

/** Generate a line chart showing daily GEXP for a player */
export async function renderPlayerGexpChart(
    playerName: string,
    data: GexpDataPoint[],
): Promise<Buffer> {
    const labels = data.map(d => fmtDate(d.date));
    const values = data.map(d => d.gexp);

    const config: ChartConfiguration = {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: `${playerName}'s Daily GEXP`,
                    data: values,
                    borderColor: '#5865f2',
                    backgroundColor: 'rgba(88, 101, 242, 0.15)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: '#5865f2',
                },
            ],
        },
        options: {
            responsive: false,
            plugins: {
                legend: { labels: { color: '#ffffff', font: { size: 14 } } },
                title: { display: false },
            },
            scales: {
                x: {
                    ticks: { color: '#b5bac1', font: { size: 11 } },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                },
                y: {
                    ticks: {
                        color: '#b5bac1',
                        font: { size: 11 },
                        callback: (v) => fmtNum(v as number),
                    },
                    grid: { color: 'rgba(255,255,255,0.08)' },
                    beginAtZero: true,
                },
            },
        },
    };

    return renderer.renderToBuffer(config);
}

/** Generate a horizontal bar chart for GEXP leaderboard */
export async function renderLeaderboardChart(
    entries: { username: string; total: number }[],
    title: string,
): Promise<Buffer> {
    const labels = entries.map(e => e.username);
    const values = entries.map(e => e.total);

    const colors = entries.map((_, i) => {
        const hue = 220 + i * 8;
        return `hsl(${hue}, 70%, ${60 - i * 2}%)`;
    });

    const config: ChartConfiguration = {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: title,
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 4,
                },
            ],
        },
        options: {
            indexAxis: 'y',
            responsive: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: title,
                    color: '#ffffff',
                    font: { size: 16 },
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: '#b5bac1',
                        font: { size: 11 },
                        callback: (v) => fmtNum(v as number),
                    },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    beginAtZero: true,
                },
                y: {
                    ticks: { color: '#ffffff', font: { size: 12 } },
                    grid: { display: false },
                },
            },
        },
    };

    return renderer.renderToBuffer(config);
}
