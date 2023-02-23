import fs from "fs/promises";
import path from "path";

/**
 *
 * @param normalisedDirName The directory to begin walking through. Normalised with path.join().
 * @param callback The callback to execute for every file found.
 * @param errMessage The error message to display if an error occurs during the process.
 */
async function recursiveWalkDir(
	normalisedDirName: string,
	callback: (currentDir: string, file: string) => Promise<void>,
	errMessage: string,
) {
	const files = await fs.readdir(normalisedDirName);

	for (const file of files) {
		const stat = await fs.lstat(path.join(normalisedDirName, file));

		if (stat.isDirectory()) {
			await recursiveWalkDir(path.join(normalisedDirName, file), callback, errMessage);
		} else {
			try {
				await callback(normalisedDirName, file);
			} catch (e: unknown) {
				console.warn(`${errMessage} ${(e as Error).message}`);
			}
		}
	}
}

export default recursiveWalkDir;
