import { Message, escapeMarkdown } from "discord.js";
import { Event } from "../../interfaces/Event";
import badWords from "../../util/badWords";
import emojis from "../../util/emojis/chatEmojis";

export default {
	name: "messageCreate",
	runOnce: false,
	run: async (bot, message: Message) => {
		if (
			message.content.startsWith(bot.botPrefix) ||
			message.author.bot ||
			message.attachments.size > 0 ||
			message.member === null ||
			(message.channel != bot.memberChannel && message.channel != bot.officerChannel)
		)
			return;

		if (message.content.length > 217) {
			await message.channel.send(`Your message is too long! \`${message.content.length}/217\``);
			return;
		}

		try {
			await message.delete();
		} catch (e) {
			await message.channel.send(`${emojis.warning} ${message.author.username}, could not delete message.`);
			bot.logger.error(e);
		}

		if (badWords.some((word) => message.content.includes(word))) {
			await message.channel.send(
				`${emojis.warning} ${message.author.username}, you may not use profane language!`,
			);
			bot.logger.warn(`Comment blocked: ${message.content} (matched bad words list)`);
			bot.sendToDiscord(
				"oc",
				`${emojis.warning} <@${message.author.id}> tried to say "${message.content}" but was blocked as it matched bad words list. This message was not sent to Hypixel.`,
			);
		} else {
			message.content = `${message.member.displayName} ${bot.chatSeparator} ${escapeMarkdown(
				message.content.replace(/\r?\n|\r/g, " "),
			)}`;

			bot.sendGuildMessage(message.channel.id === bot.memberChannel?.id ? "gc" : "oc", message.content);
		}
	},
} as Event;
