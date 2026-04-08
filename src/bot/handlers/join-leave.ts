import type Bridge from '@/bridge/bridge';
import type { ParsedJoinLeave } from '@/bot/chat-parser';
import { escapeMarkdown } from '@/util/formatting';
import emojis from '@/util/emojis';

export async function handleJoinLeave(bridge: Bridge, event: ParsedJoinLeave): Promise<void> {
    if (event.status === 'joined') {
        bridge.onlineCount += 1;
    } else {
        bridge.onlineCount = Math.max(0, bridge.onlineCount - 1);
    }

    bridge.setStatus();

    const emoji = event.status === 'joined' ? emojis.join : emojis.leave;
    await bridge.discord.send(
        'gc',
        `${emoji} **${escapeMarkdown(event.playerName)}** ${event.status}. \`(${bridge.onlineCount}/${bridge.totalCount})\``
    );
}
