import { MessageEmbed } from "discord.js";
import fs from "fs";

export default {
	name: "help",
	description: "Sends all the commands in the bot!",
	type: "CHAT_INPUT",
 
	run: async (client, interaction, args) => {
		const slashCommands = fs.readdirSync("./SlashCommands").filter((file) => file.endsWith(".js"));
		const slashCommandsArr = [];
		const embed = new MessageEmbed()
			.setTitle("Commands");

		slashCommands.map((file, i) => {
			import("./" + file)
				.then((command) => {
					command = command.default;
					if (!command.name) {return;}
					client.slashCommands.set(command.name, command);
		
					if (["MESSAGE", "USER"].includes(command.type)) {delete command.description;}
					slashCommandsArr.push(command);

					if (i == slashCommands.length - 1) {
						slashCommandsArr.forEach(slashCommand => embed.addField(slashCommand.name, slashCommand.description));
						interaction.followUp({ embeds: [embed], ephemeral: false });
					}
				});
		});
	},
};