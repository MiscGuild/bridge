import { MessageEmbed } from "discord.js";
const successColor = "0x00A86B";

export default {
	name: "ping",
	description: "See the bot's ping (ms) to Discord!",
	type: "CHAT_INPUT",
 
	run: async (client, interaction, args) => {
		const embed = new MessageEmbed()
			.setTitle("Pinging...")
			.setColor(successColor);
		interaction.followUp({ embeds: [embed] }).then(msg => {
			const ping = msg.createdTimestamp - interaction.createdTimestamp;
			const embed2 = new MessageEmbed()
				.setTitle(`Your ping is ${ping} ms`)
				.setColor(successColor);
			msg.edit({ embeds:[embed2] });
		});
	},
};
