import type Bridge from '@/bridge/bridge';
import type {
    ParsedSimple,
    ParsedGuildLevelUp,
    ParsedMemberCount,
    ParsedJoinRequest,
    ParsedLobbyJoin,
} from '@/bot/chat-parser';
import emojis from '@/util/emojis';
import { consola } from 'consola';
import messageQueue from '@/queue/message-queue';

export async function handleJoinLimbo(bridge: Bridge, _event: ParsedSimple): Promise<void> {
    bridge.bot.confirmLimbo();
}

export async function handleLobbyJoin(bridge: Bridge, event: ParsedLobbyJoin): Promise<void> {
    const botName = bridge.bot.bot?.username;
    const isSelf =
        !!botName && event.playerName.toLowerCase() === botName.toLowerCase();

    // Only the bridge account's own lobby spawn means we left limbo.
    // Ignore other players' lobby join lines (they must not reset recovery).
    if (!isSelf) return;

    bridge.bot.leftLimbo('self-lobby');
    bridge.bot.execute('/g online');
}

export async function handleGuildLevelUp(bridge: Bridge, event: ParsedGuildLevelUp): Promise<void> {
    await bridge.discord.send(
        'gc',
        `${emojis.star} **The guild has reached Level ${event.level}!**`,
        0xffaa00,
        true
    );
}

export async function handleMemberCount(bridge: Bridge, event: ParsedMemberCount): Promise<void> {
    if (event.countType === 'Online') {
        bridge.onlineCount = event.count;
    } else {
        bridge.totalCount = event.count;
    }
    bridge.setStatus();
}

export async function handleJoinRequest(bridge: Bridge, event: ParsedJoinRequest): Promise<void> {
    await bridge.discord.send(
        'oc',
        `${emojis.info} **${event.playerName}** has requested to join the guild!`
    );
}

export async function handleQuestComplete(bridge: Bridge, _event: ParsedSimple): Promise<void> {
    await bridge.discord.send('gc', `${emojis.star} **Guild quest completed!**`, 0xffaa00, true);
}

export async function handleQuestTierComplete(bridge: Bridge, _event: ParsedSimple): Promise<void> {
    await bridge.discord.send(
        'gc',
        `${emojis.star} **Guild quest tier completed!**`,
        0xffaa00,
        true
    );
}

export async function handleSameMessageTwice(_bridge: Bridge, _event: ParsedSimple): Promise<void> {
    // Clear the queue to prevent a cascade of identical rejections.
    // The message queue now auto-salts duplicates so this should be rare.
    messageQueue.clear();
    consola.warn('[MessageQueue] "Same message twice" — queue cleared.');
}

export async function handleCommentBlocked(bridge: Bridge, _event: ParsedSimple): Promise<void> {
    await bridge.discord.send(
        'oc',
        `${emojis.warning} A message was blocked by Hypixel's chat filter.`
    );
}

export async function handleWhisper(
    bridge: Bridge,
    event: { type: 'whisper'; playerName: string; message: string }
): Promise<void> {
    await bridge.discord.send(
        'oc',
        `${emojis.info} **${event.playerName}** whispered: ${event.message}`
    );
}
