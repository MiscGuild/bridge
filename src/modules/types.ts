import type Bridge from '@/bridge/bridge';
import type { ParsedGuildChat } from '@/bot/chat-parser';
import { guildRankService } from '@/services/guild-ranks';

export interface ModuleCommand {
    /** Matched against the whole chat message, e.g. /^!bw(?:\s+(\S+))?/i */
    pattern: RegExp;
    handler: (ctx: CommandContext, bridge: Bridge) => Promise<void>;
    /** Stable id, also used as the cooldown key */
    commandId: string;
    /** Only guild ranks at STAFF_MIN_RANK or above (and the Guild Master) may use it */
    staffOnly?: boolean;
}

export interface CommandContext {
    username: string;
    guildRank?: string;
    message: string;
    matches: RegExpMatchArray;
    channel: 'Guild' | 'Officer';
    /** Chat mode to reply in — matches the channel the command was sent from */
    replyChannel: 'gc' | 'oc';
}

/** The match must end at a space or the end of the message, so `!gexp` doesn't catch `!gexptop`. */
function endsAtWordBoundary(message: string, match: RegExpMatchArray): boolean {
    const end = (match.index ?? 0) + match[0].length;
    return end === message.length || /\s/.test(message.charAt(end));
}

export class ModuleManager {
    /** In-game commands, checked in registration order; the first match wins. */
    readonly commands: ModuleCommand[] = [];

    async dispatch(event: ParsedGuildChat, bridge: Bridge): Promise<boolean> {
        if (!event.message.startsWith('!')) return false;

        for (const cmd of this.commands) {
            const matches = event.message.match(cmd.pattern);
            if (!matches || !endsAtWordBoundary(event.message, matches)) continue;

            const ctx: CommandContext = {
                username: event.playerName,
                guildRank: event.guildRank,
                message: event.message,
                matches,
                channel: event.channel,
                replyChannel: event.channel === 'Officer' ? 'oc' : 'gc',
            };

            if (cmd.staffOnly && !guildRankService.isStaffRank(ctx.guildRank)) {
                bridge.bot.chat(ctx.replyChannel, `${ctx.username}, you don't have permission.`);
                return true;
            }

            await cmd.handler(ctx, bridge).catch((err) => {
                bridge.bot.chat(
                    ctx.replyChannel,
                    `Error running command: ${err instanceof Error ? err.message : err}`
                );
            });

            return true;
        }

        return false;
    }
}
