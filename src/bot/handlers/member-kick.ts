import type Bridge from '@/bridge/bridge';
import type { ParsedMemberKick } from '@/bot/chat-parser';
import { escapeMarkdown } from '@/util/formatting';
import emojis from '@/util/emojis';

export async function handleMemberKick(bridge: Bridge, event: ParsedMemberKick): Promise<void> {
    const kickerStr = `${event.kickerRank ? `${event.kickerRank} ` : ''}${escapeMarkdown(event.kickerName)}`;
    const playerStr = `${event.rank ? `${event.rank} ` : ''}${escapeMarkdown(event.playerName)}`;

    await bridge.discord.send('gc',
        `${emojis.kick} **${playerStr}** was kicked by **${kickerStr}**`,
        undefined, true
    );

    await bridge.discord.send('oc',
        `${emojis.kick} **${playerStr}** was kicked from the guild by **${kickerStr}**`
    );
}
