const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const { glob } = require("glob");
const { promisify } = require("util");
const globPromise = promisify(glob);

module.exports = {
	name: "help",
	description: "Sends all the commands in the bot!",
	type: "CHAT_INPUT",
 
	run: async (client, interaction, args) => {
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
    

		const embed = new MessageEmbed()
			.setTitle("Commands");
		arrayOfSlashCommands.forEach(i => embed.addField(i.name, i.description));
		interaction.followUp({ embeds: [embed], ephemeral: false });
	},
};