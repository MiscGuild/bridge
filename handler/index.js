const { glob } = require("glob");
const { promisify } = require("util");
const { Client } = require("discord.js");


const globPromise = promisify(glob);

module.exports = async (client) => {

	// Slash Commands
	const slashCommands = await globPromise(
		`${process.cwd()}/SlashCommands/*.js`
	);

	const arrayOfSlashCommands = [];
	slashCommands.map((value) => {
		const file = require(value);
		if (!file?.name) {return;}
		client.slashCommands.set(file.name, file);

		if (["MESSAGE", "USER"].includes(file.type)) {delete file.description;}
		arrayOfSlashCommands.push(file);
	});
	client.on("ready", async () => {
		// Register for a single guild
		await client.guilds.cache
			.get(process.env.SERVERID)
			.commands.set(arrayOfSlashCommands);

	});
    
};