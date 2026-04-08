import type Bridge from '@/bridge/bridge';
import type { ParsedMemberJoinLeave } from '@/bot/chat-parser';
import { escapeMarkdown, getRankColor } from '@/util/formatting';
import emojis from '@/util/emojis';
import { mojangService } from '@/services/mojang';
import env from '@/config/env';

export async function handleMemberJoinLeave(
    bridge: Bridge,
    event: ParsedMemberJoinLeave
): Promise<void> {
    if (event.status === 'joined') {
        const profile = await mojangService.getProfile(event.playerName);
        if (profile && bridge.blacklist.isBlacklisted(profile.id)) {
            bridge.bot.execute(
                `/g kick ${event.playerName} You have been blacklisted. Dispute? ${env.DISCORD_INVITE_LINK}`
            );
        }
    }

    const emoji = event.status === 'joined' ? emojis.positiveEvent : emojis.negativeEvent;
    await bridge.discord.send(
        'gc',
        `${emoji} **${event.rank ? `${event.rank} ` : ''}${escapeMarkdown(event.playerName)}** ${event.status} the guild!`,
        getRankColor(event.rank),
        true
    );
}
