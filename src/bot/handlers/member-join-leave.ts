import type Bridge from '@/bridge/bridge';
import type { ParsedMemberJoinLeave } from '@/bot/chat-parser';
import { escapeMarkdown, getRankColor } from '@/util/formatting';
import emojis from '@/util/emojis';
import { EmbedBuilder } from 'discord.js';
import { consola } from 'consola';
import { mojangService } from '@/services/mojang';
import env from '@/config/env';
import { getUrchinTags, enforceBlacklistKick } from '@/modules/blacklist/index';
import { blacklistRepo } from '@/db/repositories/blacklist.repo';

export async function handleMemberJoinLeave(
    bridge: Bridge,
    event: ParsedMemberJoinLeave
): Promise<void> {
    if (event.status === 'joined') {
        consola.debug(`[Blacklist] Join detected: ${event.playerName} — resolving Mojang profile`);
        const profile = await mojangService.getProfile(event.playerName);
        if (!profile) {
            consola.warn(
                `[Blacklist] Could not resolve Mojang profile for joiner ${event.playerName} — skipping blacklist check`
            );
        }
        if (profile) {
            // Cache check + DB fallback so a stale/empty in-memory cache can't silently miss.
            const cacheHit = bridge.blacklist.isBlacklisted(profile.id);
            let dbHit = false;
            if (!cacheHit) {
                try {
                    dbHit = (await blacklistRepo.getByUuid(profile.id)) !== null;
                    if (dbHit) {
                        consola.warn(
                            `[Blacklist] Cache MISS but DB HIT for ${event.playerName} (${profile.id}) — re-syncing cache`
                        );
                        bridge.blacklist.add(profile.id);
                    }
                } catch (err) {
                    consola.error(
                        `[Blacklist] DB fallback lookup failed for ${event.playerName}:`,
                        err
                    );
                }
            }

            consola.info(
                `[Blacklist] Check ${event.playerName} (${profile.id}): ` +
                    `cache=${cacheHit ? 'HIT' : 'miss'}, db=${dbHit ? 'HIT' : 'miss'}, ` +
                    `cacheSize=${bridge.blacklist._set.size}`
            );

            // Internal blacklist check — auto-kick (3 attempts, 5s gap, queue paused)
            if (cacheHit || dbHit) {
                consola.warn(
                    `[Blacklist] AUTO-KICK triggered for ${event.playerName} (${profile.id})`
                );
                enforceBlacklistKick(bridge, event.playerName).catch((err) =>
                    consola.error(`[Blacklist] enforceBlacklistKick threw:`, err)
                );
                const kickEmbed = new EmbedBuilder()
                    .setColor(0xed4245)
                    .setTitle('Auto-Kicked: Blacklisted')
                    .setThumbnail(`https://mc-heads.net/avatar/${profile.id}/64`)
                    .addFields({
                        name: 'Player',
                        value: escapeMarkdown(event.playerName),
                        inline: true,
                    })
                    .setTimestamp();
                await bridge.discord.sendEmbed('oc', kickEmbed);
            }

            // Urchin check — report to OC, don't auto-kick
            if (env.URCHIN_API_KEY) {
                const tags = await getUrchinTags(profile.id).catch(() => []);
                if (tags.length > 0) {
                    const urchinEmbed = new EmbedBuilder()
                        .setColor(0xff5555)
                        .setTitle('Urchin Tags Detected')
                        .setThumbnail(`https://mc-heads.net/avatar/${profile.id}/64`)
                        .addFields(
                            {
                                name: 'Player',
                                value: escapeMarkdown(event.playerName),
                                inline: true,
                            },
                            { name: 'Tags', value: tags.join(', '), inline: true }
                        )
                        .setTimestamp();
                    await bridge.discord.sendEmbed('oc', urchinEmbed);
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
