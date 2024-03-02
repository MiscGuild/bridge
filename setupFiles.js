// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");

const files = [".env", "src/util/blacklist/_blacklist.json"];
for (const newPath of files) {
	const oldPath = `${newPath}.template`;

	if (!fs.existsSync(oldPath)) {
		console.warn(
			`Path ${oldPath} does not exist. If you have NOT run this command before, you may need to repair your installation.`,
		);
	} else if (fs.existsSync(newPath)) {
		console.warn(`Path ${newPath} already exists.`);
	} else {
		fs.copyFileSync(oldPath, newPath);
	}
}
