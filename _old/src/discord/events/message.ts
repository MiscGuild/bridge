import { Message } from 'discord.js';
import { DataSet, RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import consola from 'consola';
import emojis from '../../util/emojis';
import env from '../../util/env';
import { isBridgeBanned } from '../../blacklist/check-user-ban';
import { containsBrainrot } from '../../util/brainrot-terms';

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

        // Check if user is bridge-banned (prevents Discord -> Minecraft messages)
        if (isBridgeBanned(name)) {
            consola.warn(`🚫 Blocked bridge message from bridge-banned Discord user: ${name}`);
            await message.delete().catch(() => {});
            await message.channel.send(
                `${emojis.warning} ${message.author.username}, you are bridge-banned and cannot send messages to Minecraft.`
            );
            return;
        }

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
            consola.error(e);
        }

        if (profanityMatcher?.hasMatch(message.content)) {
            await message.channel.send(
                `${emojis.warning} ${message.author.username}, you may not use profane language!`
            );
            consola.warn(`Comment blocked: ${message.content}`);
            bridge.discord.send(
                'oc',
                `${emojis.warning} <@${message.author.id}> tried to say "${message.content}" but was blocked. This message was not sent to Hypixel.`
            );
        } else if (containsBrainrot(message.content)) {
            await message.channel.send(
                `${emojis.warning} ${message.author.username}, brainrot terms are not allowed!`
            );
            consola.warn(`Brainrot blocked from Discord: ${message.content}`);
            bridge.discord.send(
                'oc',
                `${emojis.warning} <@${message.author.id}> tried to say "${message.content}" but was blocked by the brainrot filter. This message was not sent to Hypixel.`
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
