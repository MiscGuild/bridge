import type Bridge from '@/bridge/bridge';
import type { ParsedGuildChat } from '@/bot/chat-parser';
import { escapeMarkdown, getRankColor } from '@/util/formatting';

export async function handleGuildChat(bridge: Bridge, event: ParsedGuildChat): Promise<void> {
    const content = ` **${event.rank ? `${event.rank} ` : ''}${escapeMarkdown(event.playerName)}${
        event.guildRank ? ` ${event.guildRank}` : ''
    }:** ${escapeMarkdown(event.message)}`;

    await bridge.discord.send(
        event.channel === 'Guild' ? 'gc' : 'oc',
        content,
        getRankColor(event.rank)
    );
}
