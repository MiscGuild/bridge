import fs from 'fs/promises';
import path from 'path';
import { consola } from 'consola';

const DATA_DIR = path.resolve(process.cwd(), 'data');

async function ensureDir(): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readJson<T>(filename: string, defaultValue: T): Promise<T> {
    const file = path.join(DATA_DIR, filename);
    try {
        const raw = await fs.readFile(file, 'utf-8');
        return JSON.parse(raw) as T;
    } catch {
        return defaultValue;
    }
}

export async function writeJson<T>(filename: string, data: T): Promise<void> {
    await ensureDir();
    const file = path.join(DATA_DIR, filename);
    const tmp = `${file}.tmp`;
    try {
        await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
        await fs.rename(tmp, file);
    } catch (err) {
        consola.error(`Failed to write ${filename}:`, err);
        await fs.unlink(tmp).catch(() => {});
    }
}
