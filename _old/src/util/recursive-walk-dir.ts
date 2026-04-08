import fs from 'fs/promises';
import path from 'path';
import consola from 'consola';

/**
 *
 * @param normalisedDirName The directory to begin walking through, normalised with path.join().
 * @param callback The callback to execute for every file found.
 * @param errMessage The error message to display if an error occurs during the process.
 */
async function recursiveWalkDir(
    normalisedDirName: string,
    callback: (currentDir: string, file: string) => Promise<void>,
    errMessage: string
) {
    const files = await fs.readdir(normalisedDirName);
    const stats = await Promise.all(
        files.map((file) => fs.lstat(path.join(normalisedDirName, file)))
    );

    const promises = stats.map((stat, i) =>
        stat.isDirectory()
            ? recursiveWalkDir(path.join(normalisedDirName, files[i]!), callback, errMessage)
            : callback(normalisedDirName, files[i]!)
    );

    try {
        await Promise.all(promises);
    } catch (e: unknown) {
        consola.error(errMessage, e);
    }
}

export default recursiveWalkDir;
