import { Event } from "../../interfaces/Event";
import { Message, Util } from "discord.js";
import Bot from "../../classes/Bot";
import BadWords from "../../util/BadWords";
import Emojis from "../../util/Emojis";

export default {
	name: "messageCreate",
	runOnce: false,
	run: async (bot: Bot, message: Message) => {
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
			await message.channel.send(`${Emojis.warning} ${message.author.username}, could not delete message.`);
			bot.logger.error(e);
		}

		if (BadWords.some((word) => message.content.includes(word))) {
			await message.channel.send(
				`${Emojis.warning} ${message.author.username}, you may not use profane language!`,
			);
			bot.logger.warn(`Comment blocked by Hychat: ${message.content} (matched bad words list)`);
			bot.sendToDiscord(
				"oc",
				`${Emojis.warning} <@${message.author.id}> tried to say "${message.content}" but was blocked by Hychat (matched bad words list). This message was not sent to Hypixel.`,
			);
			return;
		}

		message.content = `${message.member.displayName} ${bot.chatSeparator} ${Util.escapeMarkdown(
			message.content.replace(/\r?\n|\r/g, " "),
		)}`;
		await bot.sendGuildMessage(message.channel.id === bot.memberChannel?.id ? "gc" : "oc", message.content);
	},
} as Event;
