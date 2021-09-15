const { Client, CommandInteraction, MessageEmbed } = require("discord.js");

module.exports = {
	name: "ping",
	description: "Returns bots ping",
	type: "CHAT_INPUT",
 
	run: async (client, interaction, args) => {
		const embed = new MessageEmbed()
			.setTitle("Pinging...")
			.setColor("RED");
		interaction.followUp({ embeds: [embed] }).then(msg => {
			const ping = msg.createdTimestamp - interaction.createdTimestamp;
			const embed2 = new MessageEmbed()
				.setTitle(`Your ping is ${ping} ms`)
				.setColor("GREEN");
			msg.edit({ embeds:[embed2] });
		});
	},
};
