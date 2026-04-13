import type Bridge from '@/bridge/bridge';
import type { ParsedMemberKick } from '@/bot/chat-parser';
import { escapeMarkdown } from '@/util/formatting';
import emojis from '@/util/emojis';

export async function handleMemberKick(bridge: Bridge, event: ParsedMemberKick): Promise<void> {
    await bridge.discord.send(
        'gc',
        `${emojis.kick} **${event.rank ? `${event.rank} ` : ''}${escapeMarkdown(event.playerName)}** was kicked by **${event.kickerRank ? `${event.kickerRank} ` : ''}${escapeMarkdown(event.kickerName)}**`,
        undefined,
        true
    );

    bridge.bot.chat('oc', `Player ${event.playerName} was kicked from the guild by ${event.kickerName}.`);
}
