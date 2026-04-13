import type Bridge from '@/bridge/bridge';
import type { ParsedMuteUnmute } from '@/bot/chat-parser';
import { escapeMarkdown } from '@/util/formatting';
import emojis from '@/util/emojis';
import { handleMuteSyncFromGame } from '@/modules/mute-warn/index';

export async function handleGuildMuteUnmute(bridge: Bridge, event: ParsedMuteUnmute): Promise<void> {
    const emoji = event.action === 'muted' ? emojis.mute : emojis.success;
    const duration = event.duration ? ` for ${event.duration}` : '';
    await bridge.discord.send(
        'gc',
        `${emoji} **${event.muterRank ? `${event.muterRank} ` : ''}${escapeMarkdown(event.muterName)}** ${event.action} **${event.targetRank ? `${event.targetRank} ` : ''}${escapeMarkdown(event.targetName)}**${duration}`,
        undefined,
        true
    );

    // Sync mute state to DB + Discord role
    await handleMuteSyncFromGame(bridge, event.action, event.targetName, event.muterName, event.duration).catch(() => {});
}
