import type Bridge from '@/bridge/bridge';
import type { ParsedJoinLeave } from '@/bot/chat-parser';
import { onPlayerOffline, onPlayerOnline } from '@/modules/tournament/presence';
import { escapeMarkdown } from '@/util/formatting';
import emojis from '@/util/emojis';
import { consola } from 'consola';

export async function handleJoinLeave(bridge: Bridge, event: ParsedJoinLeave): Promise<void> {
    if (event.status === 'joined') {
        bridge.onlineCount += 1;
        // Phase 5: guild-chat online presence → qualifying login timer
        onPlayerOnline(event.playerName).catch((err) =>
            consola.warn('[tournament] presence join hook failed:', err)
        );
    } else {
        bridge.onlineCount = Math.max(0, bridge.onlineCount - 1);
        onPlayerOffline(event.playerName).catch((err) =>
            consola.warn('[tournament] presence leave hook failed:', err)
        );
    }

    bridge.setStatus();

    const emoji = event.status === 'joined' ? emojis.join : emojis.leave;
    await bridge.discord.send(
        'gc',
        `${emoji} **${escapeMarkdown(event.playerName)}** ${event.status}. \`(${bridge.onlineCount}/${bridge.totalCount})\``
    );
}
