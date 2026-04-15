import type Bridge from '@/bridge/bridge';
import type { ParsedMemberKick } from '@/bot/chat-parser';
import { escapeMarkdown } from '@/util/formatting';
import { EmbedBuilder } from 'discord.js';

export async function handleMemberKick(bridge: Bridge, event: ParsedMemberKick): Promise<void> {
    const playerStr = `${event.rank ? `${event.rank} ` : ''}${escapeMarkdown(event.playerName)}`;
    const kickerStr = `${event.kickerRank ? `${event.kickerRank} ` : ''}${escapeMarkdown(event.kickerName)}`;

    // GC notification (compact)
    await bridge.discord.send(
        'gc',
        `**${playerStr}** was kicked by **${kickerStr}**`,
        0xed4245,
        true
    );

    // OC rich embed
    const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('Player Kicked')
        .setThumbnail(`https://mc-heads.net/avatar/${event.playerName}/64`)
        .addFields(
            { name: 'Player', value: playerStr, inline: true },
            { name: 'Kicked by', value: kickerStr, inline: true }
        )
        .setTimestamp();
    await bridge.discord.sendEmbed('oc', embed);
}
