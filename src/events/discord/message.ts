import logger from 'consola';
import { Message } from 'discord.js';
import { DataSet, RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import emojis from '../../util/emojis';
import env from '../../util/env';

const whitelist = ['ass', 'bitch', 'cock', 'dick', 'fuck'];
const dataset = new DataSet<{ originalWord: string }>()
    .addAll(englishDataset)
    .removePhrasesIf((phrase) => whitelist.includes(phrase.metadata!.originalWord));

const profanityMatcher = env.USE_PROFANITY_FILTER
    ? new RegExpMatcher({
          ...dataset.build(),
          ...englishRecommendedTransformers,
      })
    : null;

export default {
    name: 'messageCreate',
    runOnce: false,
    run: async (bot, message: Message) => {
        if (
            message.content.startsWith(bot.ignorePrefix) ||
            message.author.bot ||
            message.attachments.size > 0 ||
            message.member === null ||
            (message.channel !== bot.memberChannel && message.channel !== bot.officerChannel)
        )
            return;

        const name = env.USE_FIRST_WORD_OF_AUTHOR_NAME
            ? (message.member.displayName.split(' ')[0] as string)
            : message.member.displayName;

        if (message.content.length > 250 - name.length) {
            await message.channel.send(
                `Your message is too long! \`${message.content.length}/${250 - name.length}\``
            );
            return;
        }

        try {
            await message.delete();
        } catch (e) {
            await message.channel.send(
                `${emojis.warning} ${message.author.username}, could not delete message.`
            );
            logger.error(e);
        }

        if (profanityMatcher?.hasMatch(message.content)) {
            await message.channel.send(
                `${emojis.warning} ${message.author.username}, you may not use profane language!`
            );
            logger.warn(`Comment blocked: ${message.content}`);
            bot.sendToDiscord(
                'oc',
                `${emojis.warning} <@${message.author.id}> tried to say "${message.content}" but was blocked. This message was not sent to Hypixel.`
            );
        } else {
            const content = `${name} ${bot.chatSeparator} ${message.content.replace(
                /\r?\n|\r/g,
                ' '
            )}`;

            bot.sendGuildMessage(
                message.channel.id === bot.memberChannel?.id ? 'gc' : 'oc',
                content
            );
        }
    },
} as Event;
