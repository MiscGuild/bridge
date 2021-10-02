import { bot } from "../../index.js";
import log4js from "log4js";
const McChatLogger = log4js.getLogger("McChatLogs");
const channelID = process.env.OUTPUTCHANNELID;

export default {
	name: "message",
	async execute(message) {
		if (message.channel.id == channelID) {
			if (message.content.startsWith(process.env.PREFIX)) {
				return;
			}
			if (message.author.bot) {
				return;
			}
			if (message.attachments.size > 0) {
				return;
			}
			const user = message.member;
			if (message.content.length > 100) {
				return message.channel.send(
					`Your message is too long! ${message.content.length}/100`
				);
			}
			bot.chat(`/gc [${user.displayName.split(" ")[0]}] - ${message.content}`);
			McChatLogger.info(
				`DISCORD > [${message.author.tag}/${message.author.id}]: ${message.content}`
			);
			message.delete();
		}
	},
};
