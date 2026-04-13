import type Bridge from '@/bridge/bridge';
import type { ModuleCommand } from '@/modules/types';
import { inviteRepo } from '@/db/repositories/invites.repo';
import { mojangService } from '@/services/mojang';
import { consola } from 'consola';

/**
 * Tracks guild invites by querying `/g log <player>` when a member joins.
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

// Regex to extract inviter from guild log line
const INVITE_LOG_PATTERN = /:\s+(\w{2,17}) invited (\w{2,17})\s*$/;
const LOG_SEPARATOR = /^-{10,}$/;

/**
 * Run `/g log <player>` and parse the output for an invite entry.
 * Returns the inviter username, or null if the player wasn't invited.
 */
export async function lookupInviter(bridge: Bridge, playerName: string): Promise<string | null> {
    try {
        const rawLines = await bridge.bot.collectLines(`/g log ${playerName}`, {
            timeout: 3000,
        });

        // Mineflayer may deliver the guild log as a single multi-line string
        const lines = rawLines.flatMap(l => l.split('\n'));

        for (const line of lines) {
            const m = line.match(INVITE_LOG_PATTERN);
            if (m && m[2]!.toLowerCase() === playerName.toLowerCase()) {
                consola.info(`[invite-tracker] Found inviter: ${m[1]} for ${playerName}`);
                return m[1]!;
            }
        }
    } catch (err) {
        consola.warn(`Failed to lookup inviter for ${playerName}:`, err);
    }
    return null;
}

/**
 * Called when a member joins the guild.
 * Runs `/g log <player>` to find who invited them, then persists the invite.
 */
export async function trackInviteOnJoin(bridge: Bridge, playerName: string): Promise<void> {
    // Small delay to let the guild log update
    await new Promise(r => setTimeout(r, 2000));

    const inviter = await lookupInviter(bridge, playerName);
    if (inviter) {
        consola.info(`${inviter} invited ${playerName} to the guild.`);
        bridge.bot.chat('oc', `Player ${playerName} joined the guild! They were invited by ${inviter}.`);
        const profile = await mojangService.getProfile(playerName).catch(() => null);
        await inviteRepo.create(inviter, playerName, profile?.id ?? '').catch(() => {});
        await inviteRepo.markAccepted(playerName).catch(() => {});
    } else {
        bridge.bot.chat('oc', `Player ${playerName} joined the guild without an invite.`);
    }
}

export function registerInviteTrackerModule(commands: ModuleCommand[]): void {

    // !invites [username] — view invite history for a player
    commands.push({
        commandId: 'invitetracker:invites',
        pattern: /^!invites(?:\s+(\S+))?/i,
        async handler(ctx, bridge) {
            const target = ctx.matches[1] ?? ctx.username;
            const invites = await inviteRepo.getByInviter(target, 10).catch(() => []);
            if (invites.length === 0) {
                bridge.bot.chat('gc', `${target} has no recorded invites.`);
                return;
            }
            const accepted = invites.filter(i => i.status === 'accepted').length;
            bridge.bot.chat('gc', `${target}'s invites (${accepted}/${invites.length} accepted):`);
            for (const inv of invites.slice(0, 5)) {
                const status = inv.status === 'accepted' ? '✅' : inv.status === 'pending' ? '⏳' : '❌';
                const date = new Date(inv.invited_at).toLocaleDateString();
                bridge.bot.chat('gc', `${status} ${inv.invitee} — ${date}`);
            }
        },
    });

    // !inviteleaderboard — show top inviters
    commands.push({
        commandId: 'invitetracker:leaderboard',
        pattern: /^!inviteleaderboard/i,
        async handler(ctx, bridge) {
            const stats = await inviteRepo.getStats().catch(() => []);
            if (stats.length === 0) {
                bridge.bot.chat('gc', 'No invite data recorded yet.');
                return;
            }
            bridge.bot.chat('gc', 'Top Inviters:');
            for (const s of stats.slice(0, 5)) {
                bridge.bot.chat('gc', `• ${s.inviter}: ${s.total} invited (${s.accepted} accepted)`);
            }
        },
    });
}
