import type Bridge from '@/bridge/bridge';
import type { ParsedPromoteDemote } from '@/bot/chat-parser';
import { escapeMarkdown, getRankColor } from '@/util/formatting';
import emojis from '@/util/emojis';

export async function handlePromoteDemote(bridge: Bridge, event: ParsedPromoteDemote): Promise<void> {
    const emoji = event.action === 'promoted' ? emojis.promote : emojis.demote;
    await bridge.discord.send(
        'gc',
        `${emoji} **${event.rank ? `${event.rank} ` : ''}${escapeMarkdown(event.playerName)}** was ${event.action} from ${event.fromRank} to ${event.toRank}!`,
        getRankColor(event.rank),
        true
    );
}
