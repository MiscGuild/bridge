import { errorColor } from "../resources/consts.js";
import Discord from "discord.js";
import log4js from "log4js";
const logger = log4js.getLogger("logs");

export default {
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
				.setDescription("The bot will reboot in `30s`");
    
			interaction.followUp({ embeds: [embed] });
    
			logger.info(
				`UNSCHEDULED BOT REBOOT DUE TO ${interaction.member.displayName} RUNNING THE REBOOT COMMAND`
			);
			channel.send(
				`Bot will reboot in 30s due to ${interaction.member.displayName} running the reboot command`
			);
			setTimeout(() => {
				process.exit();
			}, 30000);
		}
		else {
			const embed = new Discord.MessageEmbed()
				.setTitle("Error")
				.setColor(errorColor)
				.setDescription(
					"It seems you are lacking the permission to run this command."
				);
    
			return interaction.followUp({ embeds: [embed], ephemeral: true });
		}
	},
};
