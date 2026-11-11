import { EmbedBuilder } from 'discord.js';
import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';
import type { ParsedMemberJoinLeave } from '@/bot/chat-parser';
import env from '@/config/env';
import { blacklistRepo } from '@/db/repositories/blacklist.repo';
import { enforceBlacklistKick } from '@/modules/blacklist/index';
import { getTagTypes } from '@/services/coral';
import { mojangService } from '@/services/mojang';
import emojis from '@/util/emojis';
import { escapeMarkdown, getRankColor } from '@/util/formatting';

export async function handleMemberJoinLeave(
    bridge: Bridge,
    event: ParsedMemberJoinLeave
): Promise<void> {
    if (event.status === 'joined') {
        await screenNewMember(bridge, event.playerName);
    }

    const emoji = event.status === 'joined' ? emojis.positiveEvent : emojis.negativeEvent;
    await bridge.discord.send(
        'gc',
        `${emoji} **${event.rank ? `${event.rank} ` : ''}${escapeMarkdown(event.playerName)}** ${event.status} the guild!`,
        getRankColor(event.rank),
        true
    );
}

/** Kick a blacklisted joiner, and flag Coral-tagged joiners in officer chat. */
async function screenNewMember(bridge: Bridge, playerName: string): Promise<void> {
    const profile = await mojangService.getProfile(playerName);
    if (!profile) {
        consola.warn(
            `[Blacklist] Could not resolve Mojang profile for joiner ${playerName} — skipping blacklist check`
        );
        return;
    }

    const entry = await blacklistRepo.getByUuid(profile.id).catch((err) => {
        consola.error(`[Blacklist] Lookup failed for ${playerName}:`, err);
        return null;
    });
    consola.info(
        `[Blacklist] Join check ${playerName} (${profile.id}): ${entry ? 'BLACKLISTED' : 'clear'}`
    );

    // Blacklisted — auto-kick (3 attempts, 5s gap, queue paused)
    if (entry) {
        consola.warn(`[Blacklist] AUTO-KICK triggered for ${playerName} (${profile.id})`);
        enforceBlacklistKick(bridge, playerName).catch((err) =>
            consola.error(`[Blacklist] enforceBlacklistKick threw:`, err)
        );
        const kickEmbed = new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('Auto-Kicked: Blacklisted')
            .setThumbnail(`https://mc-heads.net/avatar/${profile.id}/64`)
            .addFields({ name: 'Player', value: escapeMarkdown(playerName), inline: true })
            .setTimestamp();
        await bridge.discord.sendEmbed('oc', kickEmbed);
    }

    // Coral tags — reported to officer chat, not kicked (needs URCHIN_JOIN_CHECK)
    if (env.URCHIN_API_KEY && env.URCHIN_JOIN_CHECK) {
        const tags = await getTagTypes(profile.id).catch(() => []);
        if (tags.length > 0) {
            const coralEmbed = new EmbedBuilder()
                .setColor(0xff5555)
                .setTitle('Coral Tags Detected')
                .setThumbnail(`https://mc-heads.net/avatar/${profile.id}/64`)
                .addFields(
                    { name: 'Player', value: escapeMarkdown(playerName), inline: true },
                    { name: 'Tags', value: tags.join(', '), inline: true }
                )
                .setTimestamp();
            await bridge.discord.sendEmbed('oc', coralEmbed);
        }
    }
}
