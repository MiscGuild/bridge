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
				.then((file) => {
					file = file.default;
					if (!file.name) {return;}
					client.slashCommands.set(file.name, file);
		
					if (["MESSAGE", "USER"].includes(file.type)) {delete file.description;}
					slashCommandsArr.push(file);

					if (i == slashCommands.length - 1) {
						slashCommandsArr.forEach(command => embed.addField(command.name, command.description));
						interaction.followUp({ embeds: [embed], ephemeral: false });
					}
				});
		});
	},
};