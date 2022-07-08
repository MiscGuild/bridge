import fs from "fs/promises";
import path from "path";
import recursiveWalkDir from "../recursiveWalkDir";

export default async () => {
	const buffers: { [key: string]: Buffer } = {};

	const callback = async (currentDir: string, file: string) => {
		const name = file.split(".")[0] as string;
		const buffer = await fs.readFile(path.join(currentDir, file));
		buffers[name] = buffer;
	};

	await recursiveWalkDir(path.join(__dirname, "./images"), callback, "Error while fetching image buffers: ");

	return buffers;
};
