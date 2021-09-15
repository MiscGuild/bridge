const { Client, CommandInteraction } = require("discord.js");
const Discord = require("discord.js");
const log4js = require("log4js");
const logger = log4js.getLogger("logs");

module.exports = {
	name: "reboot",
	description: "Reboots the bot",
	type: "CHAT_INPUT",
 
	run: async (client, interaction, args) => {
		const channel = client.channels.cache.get(process.env.OUTPUTCHANNELID);

		if (
			interaction.member.roles.cache.some((role) => role.name === "Staff") ||
            interaction.member.id === "308343641598984203"
		) {
			const embed = new Discord.MessageEmbed()
				.setTitle("Rebooting")
				.setDescription("The bot will reboot in `45s`");
    
			interaction.followUp({ embeds: [embed] });
    
			logger.info(
				`Bot will reboot in 45s due to ${interaction.member.displayName} running the reboot command`
			);
			channel.send(
				`Bot will reboot in 45s due to ${interaction.member.displayName} running the reboot command`
			);
			setTimeout(() => {
				process.exit();
			}, 45000);
		}
		else {
			const embed = new Discord.MessageEmbed()
				.setTitle("Error")
			// .setColor(CLR)
				.setDescription(
					"It seems you are lacking the permission to run this command."
				);
    
			return interaction.followUp({ embeds: [embed], ephemeral: true });
		}
	},
};
