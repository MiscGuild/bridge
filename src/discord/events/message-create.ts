import { Message } from 'discord.js';
import { DataSet, RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';
import emojis from '@/util/emojis';
import env from '@/config/env';

const whitelist = ['ass', 'bitch', 'cock', 'dick', 'fuck'];
const dataset = new DataSet<{ originalWord: string }>()
    .addAll(englishDataset)
    .removePhrasesIf((p) => whitelist.includes(p.metadata!.originalWord));

const profanityMatcher = env.USE_PROFANITY_FILTER
    ? new RegExpMatcher({ ...dataset.build(), ...englishRecommendedTransformers })
    : null;

const guildMemberRoleIds = env.GUILD_MEMBER_ROLE_IDS
    ? env.GUILD_MEMBER_ROLE_IDS.split(',').map(id => id.trim()).filter(Boolean)
    : [];

/** Check if a member has permission to use the bridge */
function hasBridgeAccess(member: Message['member']): boolean {
    if (!member) return false;
    const roles = member.roles.cache;

    // Staff always have access
    if (env.STAFF_ROLE_ID && roles.has(env.STAFF_ROLE_ID)) return true;

    // Guild member roles grant access
    if (guildMemberRoleIds.some(id => roles.has(id))) return true;

    // Bridge-Access role grants access to non-guild members
    if (env.BRIDGE_ACCESS_ROLE_ID && roles.has(env.BRIDGE_ACCESS_ROLE_ID)) return true;

    // If no role-based access is configured, fall back to "has a member object" (original behavior)
    if (!env.BRIDGE_MUTED_ROLE_ID && !env.BRIDGE_ACCESS_ROLE_ID && guildMemberRoleIds.length === 0) {
        return true;
    }

    return false;
}

function isBridgeMuted(member: Message['member']): boolean {
    if (!member) return false;
    return !!(env.BRIDGE_MUTED_ROLE_ID && member.roles.cache.has(env.BRIDGE_MUTED_ROLE_ID));
}

export default {
    name: 'messageCreate',
    once: false,
    run: async (bridge: Bridge, message: Message) => {
        if (
            message.content.startsWith(env.DISCORD_IGNORE_PREFIX) ||
            message.author.bot ||
            message.attachments.size > 0 ||
            message.member === null ||
            (message.channel !== bridge.discord.memberChannel &&
                message.channel !== bridge.discord.officerChannel)
        ) return;

        // Bridge-Muted role blocks bridge access
        if (isBridgeMuted(message.member)) {
            await message.delete().catch(() => {});
            await message.channel.send(
                `${emojis.warning} ${message.author.username}, you are muted from the bridge.`
            ).then(m => setTimeout(() => m.delete().catch(() => {}), 5_000));
            return;
        }

        // Role-based access check
        if (!hasBridgeAccess(message.member)) {
            await message.delete().catch(() => {});
            return;
        }

        const name = env.USE_FIRST_WORD_OF_AUTHOR_NAME
            ? (message.member.displayName.split(' ')[0] ?? message.member.displayName)
            : message.member.displayName;

        const { allowed, reason } = bridge.filterMessage(message.content, name);

        if (!allowed) {
            await message.delete().catch(() => {});
            await message.channel.send(
                `${emojis.warning} ${message.author.username}, ${reason}`
            );
            return;
        }

        if (message.content.length > 250 - name.length) {
            await message.channel.send(
                `Your message is too long! \`${message.content.length}/${250 - name.length}\``
            );
            return;
        }

        await message.delete().catch(() => {});

        if (profanityMatcher?.hasMatch(message.content)) {
            await message.channel.send(
                `${emojis.warning} ${message.author.username}, you may not use profane language!`
            );
            bridge.discord.send('oc', `${emojis.warning} <@${message.author.id}> tried to say "${message.content}" — blocked by profanity filter.`);
            return;
        }

        const content = `${name} ${env.MINECRAFT_CHAT_SEPARATOR} ${message.content.replace(/\r?\n|\r/g, ' ')}`;
        bridge.bot.chat(
            message.channel.id === bridge.discord.memberChannel?.id ? 'gc' : 'oc',
            content
        );
    },
};
