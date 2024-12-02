/* eslint-disable no-console */
const fs = require('fs');

const oldPaths = ['.env.template', 'src/blacklist/_blacklist.json.template'];
oldPaths.forEach((path) => {
    if (!fs.existsSync(path)) {
        console.warn(
            `'${path}' does not exist. If you have NOT run this command before, you may need to repair your installation.`
        );

        return;
    }

    const newPath = path.substring(0, path.indexOf('.template'));
    if (fs.existsSync(newPath)) {
        console.warn(`'${newPath}' already exists.`);
    } else {
        fs.copyFileSync(path, newPath, fs.constants.COPYFILE_EXCL);
    }
});
