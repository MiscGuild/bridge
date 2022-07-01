import fs from "fs/promises";
import path from "path";

const buffers: { [key: string]: Buffer } = {};

export default async () => {
	await walk();

	return buffers;
};

async function walk(dir = "./images") {
	const files = await fs.readdir(path.join(__dirname, dir));

	for (const file of files) {
		const stat = await fs.lstat(path.join(__dirname, dir, file));

		if (stat.isDirectory()) {
			await walk(path.join(dir, file));
		} else {
			try {
				const name = file.split(".")[0] as string;
				const buffer = await fs.readFile(path.join(__dirname, dir, file));
				buffers[name] = buffer;

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (e: any) {
				console.warn(`Error while loading commands: ${e.message}`);
			}
		}
	}
}
