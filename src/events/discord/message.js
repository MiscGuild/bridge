import { bot } from "../../../index.js";
import { prefix, channelID, staffChannelID } from "../../resources/consts.js";
import log4js from "log4js";
import emojiToWords from "../../resources/emojiToWords.js";
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

		const discordEmojis = message.content.match(/(?!:)\w*(?=:)/g); // Grab name of custom Discord emojis <:NAME:ID>
		const unicodeEmojis = message.content.match(/([\u2700—\u27BF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF])/g); // Dingbats, emojis
		if (discordEmojis) {
			for (const emoji of discordEmojis) {
				message.content = message.content.replace(/<a:.+?:\d+>|<:.+?:\d+>/, ":" + emoji + ":"); // Replace the first occuring custom Discord emoji
			}
		}
		if (unicodeEmojis) {
			for (const emoji of unicodeEmojis) {
				const replacement = emojiToWords[`0x${emoji.codePointAt(0).toString(16)}`] ?? "?";
				message.content = message.content.replace(emoji, ":" + replacement + ":");
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
