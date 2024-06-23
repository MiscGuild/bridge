import { Message } from 'discord.js';
// import { DataSet, RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import emojis from '@util/emojis';
import replaceEmojis from '@util/custom-emojis';
import replaceUserPings from '@util/replace-user-ping';

const badwords = ['cock', 'dick', 'coon', 'czarnuch', 'Czarnuch', 'K Y S', 'K YS', 'kill yourself', 'KY S', 'kys', 'n i g g a', 'n i g g a s', 'n i g g e r', 'n i g g e r s', 'N igga', 'n igger', 'negerzoen', 'negr', 'Negr', 'ngga', 'NGGA', 'ni gga', 'ni gger', 'Nig', 'nig ga', 'nig ger', 'niga', 'nigA', 'niGa', 'nIga', 'Niga', 'NIGA', 'nigg', 'nigg a', 'NIGG A', 'nigg er', 'nigg3r', 'Nigga', 'niggas', 'nigge r', 'Nigger', 'niggerlecton', 'niggerman', 'niggermancer', 'niggers', 'niglet', 'niguh', 'nlgg3r', 'nlgga', 'nlgger', 'nlggers', 'nyagah', 'ниггер'];
// const dataset = new DataSet<{ originalWord: string }>()
//     .addAll(englishDataset)
//     .removePhrasesIf((phrase) => whitelist.includes(phrase.metadata!.originalWord));

// const profanityMatcher = new RegExpMatcher({
//     ...dataset.build(),
//     ...englishRecommendedTransformers,
// });

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

        const name =
            process.env.USE_FIRST_WORD_OF_AUTHOR_NAME === 'true'
                ? (message.member.user.username.split(' ')[0] as string).replace('.', '')
                : message.member.user.username.replace('.', '');

        if (message.content.length > 250 - name.length) {
            await message.channel.send(
                `Your message is too long! \`${message.content.length}/${250 - name.length}\``
            );
            return;
        }

        if (process.env.DELETE_MESSAGE === 'true') {
            try {
                await message.delete();
            } catch (e) {
                await message.channel.send(
                    `${emojis.warning} ${message.author.username}, could not delete message.`
                );
                bot.logger.error(e);
            }
        }

        if (badwords.some(word => message.content.includes(word))) {
            await message.channel.send(
                `${emojis.warning} ${message.author.username}, you may not use profane language!`
            );
            await message.delete();
            bot.logger.warn(`Comment blocked: ${message.content}`);
            await bot.sendToDiscord(
                'oc',
                `${emojis.warning} <@${message.author.id}> tried to say "${message.content}" but was blocked. This message was not sent to Hypixel.`
            );
        } else {
            // Message sent to mc
            let content = `${name} ${bot.chatSeparator} ${message.content.replace(
                /\r?\n|\r/g,
                ' '
            )}`;

            content = replaceEmojis(content);
            content = replaceUserPings(bot.discord.users.cache, content);

            bot.sendGuildMessage(
                message.channel.id === bot.memberChannel?.id ? 'gc' : 'oc',
                content
            );
        }
    },
} as Event;
