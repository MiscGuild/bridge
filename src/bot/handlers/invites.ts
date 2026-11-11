import { EmbedBuilder } from 'discord.js';
import { consola } from 'consola';
import type Bridge from '@/bridge/bridge';
import { mojangService } from '@/services/mojang';

/**
 * Finds who invited a new member by reading `/g log <player>`.
 *
 * Guild log output example:
 * -----------------------------------------------------
 *                      Guild Log (Page 1 of 1)
 *
 * Apr 13 2026 07:37 EDT: Cylices joined
 * Apr 13 2026 07:37 EDT: oTrust invited Cylices
 * -----------------------------------------------------
 *
 * If no invite line is present, the player joined via open guild or /g accept.
 */
const INVITE_LOG_PATTERN = /:\s+(\w{2,17}) invited (\w{2,17})\s*$/;

/** The inviter's username, or null if the player wasn't invited. */
async function lookupInviter(bridge: Bridge, playerName: string): Promise<string | null> {
    try {
        const rawLines = await bridge.bot.collectLines(`/g log ${playerName}`, {
            timeout: 3000,
        });

        // Mineflayer may deliver the guild log as a single multi-line string
        const lines = rawLines.flatMap((l) => l.split('\n'));

        for (const line of lines) {
            const m = line.match(INVITE_LOG_PATTERN);
            if (m && m[2]!.toLowerCase() === playerName.toLowerCase()) {
                consola.info(`[invites] Found inviter: ${m[1]} for ${playerName}`);
                return m[1]!;
            }
        }
    } catch (err) {
        consola.warn(`Failed to lookup inviter for ${playerName}:`, err);
    }
    return null;
}

/** When someone joins the guild, post who invited them (if anyone) to officer chat. */
export async function announceInviter(bridge: Bridge, playerName: string): Promise<void> {
    // Small delay to let the guild log update
    await new Promise((r) => setTimeout(r, 2000));

    const inviter = await lookupInviter(bridge, playerName);
    const profile = await mojangService.getProfile(playerName).catch(() => null);
    const embed = new EmbedBuilder()
        .setThumbnail(`https://mc-heads.net/avatar/${profile?.id ?? playerName}/64`)
        .setTimestamp();

    if (inviter) {
        consola.info(`${inviter} invited ${playerName} to the guild.`);
        embed
            .setColor(0x57f287)
            .setTitle('📨 Player Joined — Invited')
            .addFields(
                { name: 'Player', value: playerName, inline: true },
                { name: 'Invited by', value: inviter, inline: true }
            );
    } else {
        embed
            .setColor(0xfee75c)
            .setTitle('Player Joined — No Invite')
            .addFields({ name: 'Player', value: playerName, inline: true });
    }

    await bridge.discord.sendEmbed('oc', embed);
}
