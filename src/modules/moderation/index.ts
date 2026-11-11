import type { GuildMember } from 'discord.js';
import env from '@/config/env';
import type { ModuleCommand } from '@/modules/types';
import { findMemberByBridgeName } from '@/util/discord-members';

/**
 * Give or take BRIDGE_MUTED_ROLE_ID. Members with the role can still read the bridge
 * channels, but their messages aren't sent to Minecraft.
 */
export async function setBridgeMuted(
    member: GuildMember,
    muted: boolean,
    reason?: string
): Promise<void> {
    const roleId = env.BRIDGE_MUTED_ROLE_ID;
    if (!roleId) throw new Error('BRIDGE_MUTED_ROLE_ID is not configured.');
    if (muted) await member.roles.add(roleId, reason);
    else await member.roles.remove(roleId, reason);
}

export function registerModerationModule(commands: ModuleCommand[]): void {
    // !bridge-mute <name> [reason] / !bridge-unmute <name> — `name` is the Discord name shown in-game
    for (const muted of [true, false]) {
        const command = muted ? 'bridge-mute' : 'bridge-unmute';
        commands.push({
            commandId: `mod:${command}`,
            pattern: new RegExp(`^!${command}\\s+(\\S+)(?:\\s+(.+))?`, 'i'),
            staffOnly: true,
            async handler(ctx, bridge) {
                const name = ctx.matches[1]!;
                const reason = ctx.matches[2];

                const member = await findMemberByBridgeName(bridge, name);
                if (!member) {
                    bridge.bot.chat(ctx.replyChannel, `No Discord member found named ${name}.`);
                    return;
                }

                await setBridgeMuted(
                    member,
                    muted,
                    `${ctx.username} (in-game)${reason ? `: ${reason}` : ''}`
                );
                bridge.bot.chat(
                    'oc',
                    `${ctx.username} ${muted ? 'bridge-muted' : 'bridge-unmuted'} ${name}${reason ? `: ${reason}` : ''}`
                );
            },
        });
    }

    // !reboot — exit the process; the process manager (e.g. PM2) starts it again
    commands.push({
        commandId: 'mod:reboot',
        pattern: /^!reboot/i,
        staffOnly: true,
        async handler(ctx, bridge) {
            bridge.bot.markShuttingDown();
            bridge.bot.chat(ctx.replyChannel, `Rebooting... requested by ${ctx.username}`);
            setTimeout(() => process.exit(0), 2000);
        },
    });
}
