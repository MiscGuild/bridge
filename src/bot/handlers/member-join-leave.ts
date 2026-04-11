import type Bridge from '@/bridge/bridge';
import type { ParsedMemberJoinLeave } from '@/bot/chat-parser';
import { escapeMarkdown, getRankColor } from '@/util/formatting';
import emojis from '@/util/emojis';
import { mojangService } from '@/services/mojang';
import env from '@/config/env';

async function checkUrchinBan(uuid: string): Promise<boolean> {
    const key = process.env['URCHIN_API_KEY'];
    if (!key || !env.URCHIN_JOIN_CHECK) return false;
    try {
        const res = await fetch(`https://api.urchin.gg/v1/player/${uuid}`, {
            headers: { Authorization: `Bearer ${key}`, 'User-Agent': 'BridgeBot/2.0' },
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { banned?: boolean };
        return data.banned === true;
    } catch { return false; }
}

export async function handleMemberJoinLeave(
    bridge: Bridge,
    event: ParsedMemberJoinLeave
): Promise<void> {
    if (event.status === 'joined') {
        const profile = await mojangService.getProfile(event.playerName);
        if (profile) {
            // Internal blacklist check
            if (bridge.blacklist.isBlacklisted(profile.id)) {
                bridge.bot.execute(
                    `/g kick ${event.playerName} You have been blacklisted. Dispute? ${env.DISCORD_INVITE_LINK}`
                );
            } else {
                // Urchin API auto-check on guild join
                const banned = await checkUrchinBan(profile.id);
                if (banned) {
                    bridge.bot.execute(
                        `/g kick ${event.playerName} Urchin-flagged. Dispute? ${env.DISCORD_INVITE_LINK}`
                    );
                    bridge.bot.chat('oc', `⚠️ Auto-kicked ${event.playerName}: Urchin flagged`);
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
