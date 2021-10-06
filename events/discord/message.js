import { bot } from "../../index.js";
import { prefix, channelID, staffChannelID } from "../../resources/consts.js";
import log4js from "log4js";
const McChatLogger = log4js.getLogger("McChatLogs");

export default {
	name: "message",
	async execute(message) {
		if (message.content.startsWith(prefix) || message.author.bot || message.attachments.size > 0) {
			return;
		}

		if (message.channel.id != channelID && message.channel.id != staffChannelID) {
			return;
		}

		const customEmojis = message.content.match(/(?!:)\w*(?=:)/g); // Grab name of custom Discord emojis <:NAME:ID>
		if (customEmojis) {
			for (const emojiName of customEmojis) {
				message.content = message.content.replace(/<a:.+?:\d+>|<:.+?:\d+>/, ":" + emojiName + ":"); // Replace the first occuring custom Discord emoji
			}
		}

		if (message.content.length > 100) {
			return message.channel.send(
				`Your message is too long! ${message.content.length}/100`
			);
		}

		let channel;
		if (message.channel.id == channelID) {
			channel = "GC";
		}
		else if (message.channel.id == staffChannelID) {
			channel = "OC";
		}

		bot.chat(`/${channel} [${message.member.displayName.split(" ")[0]}] - ${message.content}`);
		McChatLogger.info(
			`DISCORD (${channel})> [${message.author.tag}/${message.author.id}]: ${message.content}`
		);

		try {
			message.delete();
		}
		catch {}
	},
};
