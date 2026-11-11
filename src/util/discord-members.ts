import type { GuildMember } from 'discord.js';
import type Bridge from '@/bridge/bridge';
import env from '@/config/env';

/** The name a Discord member's bridged messages appear under in Minecraft. */
export function bridgeName(member: GuildMember): string {
    return env.USE_FIRST_WORD_OF_AUTHOR_NAME
        ? (member.displayName.split(' ')[0] ?? member.displayName)
        : member.displayName;
}

/**
 * Find the Discord member behind a name seen in Minecraft chat. Matches their bridge
 * name, display name or username, ignoring case.
 */
export async function findMemberByBridgeName(
    bridge: Bridge,
    name: string
): Promise<GuildMember | null> {
    const guild = bridge.discord.memberChannel?.guild;
    if (!guild) return null;

    const wanted = name.toLowerCase();
    const candidates = await guild.members.fetch({ query: name, limit: 10 }).catch(() => null);
    return (
        candidates?.find((m) =>
            [bridgeName(m), m.displayName, m.user.username].some((n) => n.toLowerCase() === wanted)
        ) ?? null
    );
}
