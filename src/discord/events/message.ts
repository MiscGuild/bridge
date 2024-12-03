import { Message } from 'discord.js';
import { DataSet, RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import winston from 'winston';
import emojis from '@util/emojis';
import env from '@util/env';

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
    run: async (bridge, message: Message) => {
        if (
            message.content.startsWith(env.DISCORD_IGNORE_PREFIX) ||
            message.author.bot ||
            message.attachments.size > 0 ||
            message.member === null ||
            (message.channel !== bridge.discord.memberChannel &&
                message.channel !== bridge.discord.officerChannel)
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
            winston.error(e);
        }

        if (profanityMatcher?.hasMatch(message.content)) {
            await message.channel.send(
                `${emojis.warning} ${message.author.username}, you may not use profane language!`
            );
            winston.warn(`Comment blocked: ${message.content}`);
            bridge.discord.send(
                'oc',
                `${emojis.warning} <@${message.author.id}> tried to say "${message.content}" but was blocked. This message was not sent to Hypixel.`
            );
        } else {
            const content = `${name} ${env.MINECRAFT_CHAT_SEPARATOR} ${message.content.replace(
                /\r?\n|\r/g,
                ' '
            )}`;

            bridge.mineflayer.chat(
                message.channel.id === bridge.discord.memberChannel?.id ? 'gc' : 'oc',
                content
            );
        }
    },
} as BotEvent;
