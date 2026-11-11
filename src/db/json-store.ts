import fs from 'fs/promises';
import path from 'path';

/** Everything the bot persists lives in ./data as JSON files. */
const DATA_DIR = path.resolve(process.cwd(), 'data');

/** One promise chain per file, so reads-then-writes to the same file never interleave. */
const fileQueues = new Map<string, Promise<unknown>>();

function serialize<R>(filename: string, task: () => Promise<R>): Promise<R> {
    const run = (fileQueues.get(filename) ?? Promise.resolve()).then(task);
    // A failed task mustn't block the ones queued after it
    fileQueues.set(
        filename,
        run.catch(() => undefined)
    );
    return run;
}

/**
 * Read `data/<filename>`. A missing file returns `fallback`; a file that exists but
 * can't be parsed throws, so a damaged file is never mistaken for an empty one.
 */
export async function readJson<T>(filename: string, fallback: T): Promise<T> {
    try {
        return JSON.parse(await fs.readFile(path.join(DATA_DIR, filename), 'utf-8')) as T;
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
        throw new Error(`Could not read data/${filename}: ${(err as Error).message}`);
    }
}

/** Write to a temp file, then rename over the original, so a crash never leaves half a file. */
async function writeAtomic(filename: string, data: unknown): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const file = path.join(DATA_DIR, filename);
    const tmp = `${file}.tmp`;
    try {
        await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
        await fs.rename(tmp, file);
    } catch (err) {
        await fs.unlink(tmp).catch(() => {});
        throw err;
    }
}

/** Replace the contents of `data/<filename>`. */
export function writeJson<T>(filename: string, data: T): Promise<void> {
    return serialize(filename, () => writeAtomic(filename, data));
}

/**
 * Read, change and write `data/<filename>` as one step, so two updates running at the
 * same time can't overwrite each other. `mutate` edits the data in place; whatever it
 * returns is passed back to the caller.
 */
export function updateJson<T, R>(
    filename: string,
    fallback: T,
    mutate: (data: T) => R
): Promise<R> {
    return serialize(filename, async () => {
        const data = await readJson(filename, fallback);
        const result = mutate(data);
        await writeAtomic(filename, data);
        return result;
    });
}
