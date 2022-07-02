import fs from "fs/promises";
import path from "path";
import recursiveWalkDir from "../recursiveWalkDir";

const buffers: { [key: string]: Buffer } = {};

export default async () => {
	await walk();

	return buffers;
};

async function walk(dir = "./images") {
	const callback = async (file: string) => {
		const name = file.split(".")[0] as string;
		const buffer = await fs.readFile(path.join(__dirname, dir, file));
		buffers[name] = buffer;
	};

	recursiveWalkDir(path.join(__dirname, dir), callback, "Error while fetching image buffers: ");
}
