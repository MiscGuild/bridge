import { Message } from "discord.js";
import { DataSet, RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";
import { Event } from "../../interfaces/Event";
import emojis from "../../util/emojis/chatEmojis";

const whitelist = ["ass", "bitch", "cock", "dick", "fuck"];
const dataset = new DataSet<{ originalWord: string }>()
	.addAll(englishDataset)
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	.removePhrasesIf((phrase) => whitelist.includes(phrase.metadata!.originalWord));

const profanityMatcher = new RegExpMatcher({ ...dataset.build(), ...englishRecommendedTransformers });

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

		if (profanityMatcher.hasMatch(message.content)) {
			await message.channel.send(
				`${emojis.warning} ${message.author.username}, you may not use profane language!`,
			);
			bot.logger.warn(`Comment blocked: ${message.content}`);
			bot.sendToDiscord(
				"oc",
				`${emojis.warning} <@${message.author.id}> tried to say "${message.content}" but was blocked. This message was not sent to Hypixel.`,
			);
		} else {
			const name =
				process.env.USE_FIRST_WORD_OF_AUTHOR_NAME === "true"
					? message.member.displayName.split(" ")[0]
					: message.member.displayName;

			message.content = `${name} ${bot.chatSeparator} ${message.content.replace(/\r?\n|\r/g, " ")}`;
			bot.sendGuildMessage(message.channel.id === bot.memberChannel?.id ? "gc" : "oc", message.content);
		}
	},
} as Event;
