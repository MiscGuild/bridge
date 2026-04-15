import type Bridge from '@/bridge/bridge';
import type { ParsedGuildChat } from '@/bot/chat-parser';

export interface ModuleCommand {
    /** Regex that matches the message content (e.g. /^!bw(?:\s+(.+))?$/i) */
    pattern: RegExp;
    /** Handler called when pattern matches */
    handler: (ctx: CommandContext, bridge: Bridge) => Promise<void>;
    /** Cooldown command ID (for CooldownManager) */
    commandId: string;
    /** Whether this command needs staff rank */
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

export class ModuleManager {
    private commands: ModuleCommand[] = [];

    register(command: ModuleCommand): void {
        this.commands.push(command);
    }

    registerAll(commands: ModuleCommand[]): void {
        this.commands.push(...commands);
    }

    async dispatch(event: ParsedGuildChat, bridge: Bridge): Promise<boolean> {
        if (!event.message.startsWith('!')) return false;

        for (const cmd of this.commands) {
            const matches = event.message.match(cmd.pattern);
            if (!matches) continue;

            const ctx: CommandContext = {
                username: event.playerName,
                guildRank: event.guildRank,
                message: event.message,
                matches,
                channel: event.channel,
                replyChannel: event.channel === 'Officer' ? 'oc' : 'gc',
            };

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
