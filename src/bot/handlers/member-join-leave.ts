import type Bridge from '@/bridge/bridge';
import type { ParsedMemberJoinLeave } from '@/bot/chat-parser';
import { escapeMarkdown, getRankColor } from '@/util/formatting';
import emojis from '@/util/emojis';
import { mojangService } from '@/services/mojang';
import env from '@/config/env';
import { getUrchinTags } from '@/modules/blacklist/index';

export async function handleMemberJoinLeave(
    bridge: Bridge,
    event: ParsedMemberJoinLeave
): Promise<void> {
    if (event.status === 'joined') {
        const profile = await mojangService.getProfile(event.playerName);
        if (profile) {
            // Internal blacklist check — auto-kick
            if (bridge.blacklist.isBlacklisted(profile.id)) {
                bridge.bot.execute(
                    `/g kick ${event.playerName} You have been blacklisted. Dispute? ${env.DISCORD_INVITE_LINK}`
                );
                await bridge.discord.send('oc', `⚠️ Auto-kicked **${escapeMarkdown(event.playerName)}**: on guild blacklist`);
            }

            // Urchin check — report to OC, don't auto-kick
            if (env.URCHIN_API_KEY) {
                const tags = await getUrchinTags(profile.id).catch(() => []);
                if (tags.length > 0) {
                    await bridge.discord.send('oc',
                        `⚠️ **${escapeMarkdown(event.playerName)}** joined and has Urchin tags: **${tags.join(', ')}**`,
                        0xff5555
                    );
                }
            }
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
