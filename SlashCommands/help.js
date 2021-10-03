import { MessageEmbed } from "discord.js";
import fs from "fs";

export default {
	name: "help",
	description: "Sends all the commands in the bot!",
	type: "CHAT_INPUT",
 
	run: async (client, interaction, args) => {
		const slashCommands = fs.readdirSync("./").filter((file) => file.endsWith(".js"));
		const slashCommandsArr = [];
		slashCommands.map((file) => {
			import(file)
				.then((file) => {
					file = file.default;
					if (!file?.name) {return;}
					client.slashCommands.set(file.name, file);
		
					if (["MESSAGE", "USER"].includes(file.type)) {delete file.description;}
					slashCommandsArr.push(file);
				});
		});
    

		const embed = new MessageEmbed()
			.setTitle("Commands");
		slashCommandsArr.forEach(i => embed.addField(i.name, i.description));
		interaction.followUp({ embeds: [embed], ephemeral: false });
	},
};