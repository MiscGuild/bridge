import * as readline from 'readline';
import { consola } from 'consola';
import env from '@/config/env';
import type Bridge from '@/bridge/bridge';

/**
 * Interactive terminal REPL for sending commands to the bot.
 *
 * Supports:
 *  - /gc <message>      — send to guild chat
 *  - /oc <message>      — send to officer chat
 *  - /cmd <raw command> — send raw command (e.g. /g kick Player)
 *  - /online            — show online count
 *  - /status            — show bot state
 *  - /reconnect         — force reconnect
 *  - /stop / /exit      — graceful shutdown
 *  - Bare text          — sent to guild chat (if ENABLE_TERMINAL_CHAT)
 */
export function startTerminalRepl(bridge: Bridge): void {
    if (!env.ENABLE_TERMINAL) return;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> ',
        terminal: true,
    });

    consola.success('Terminal REPL enabled. Type /help for commands.');
    rl.prompt();

    rl.on('line', (line) => {
        const input = line.trim();
        if (!input) {
            rl.prompt();
            return;
        }

        // Built-in terminal commands
        if (input.startsWith('/')) {
            const [cmd, ...rest] = input.split(' ');
            const args = rest.join(' ');

            switch (cmd!.toLowerCase()) {
                case '/help':
                    console.log(
                        [
                            '',
                            '  /gc <msg>       Send to guild chat',
                            '  /oc <msg>       Send to officer chat',
                            '  /cmd <raw>      Send raw command to Minecraft',
                            '  /online         Show online member count',
                            '  /status         Show bot connection state',
                            '  /reconnect      Force reconnect',
                            '  /stop, /exit    Graceful shutdown',
                            '  /help           Show this help',
                            '',
                        ].join('\n')
                    );
                    break;

                case '/gc':
                    if (!args) {
                        consola.warn('Usage: /gc <message>');
                        break;
                    }
                    bridge.bot.chat('gc', args);
                    consola.info(`[GC] → ${args}`);
                    break;

                case '/oc':
                    if (!args) {
                        consola.warn('Usage: /oc <message>');
                        break;
                    }
                    bridge.bot.chat('oc', args);
                    consola.info(`[OC] → ${args}`);
                    break;

                case '/cmd':
                    if (!args) {
                        consola.warn('Usage: /cmd <raw command>');
                        break;
                    }
                    bridge.bot.execute(args.startsWith('/') ? args : `/${args}`);
                    consola.info(`[CMD] → ${args}`);
                    break;

                case '/online':
                    consola.info(`Online: ${bridge.onlineCount}/${bridge.totalCount}`);
                    break;

                case '/status':
                    consola.info(`Bot state: ${bridge.bot.state}`);
                    break;

                case '/reconnect':
                    consola.info('Forcing reconnect...');
                    bridge.bot.disconnect();
                    setTimeout(() => bridge.bot.connect(), 2000);
                    break;

                case '/stop':
                case '/exit':
                    consola.info('Shutting down from terminal...');
                    rl.close();
                    bridge.shutdown().then(() => process.exit(0));
                    return;

                default:
                    consola.warn(`Unknown command: ${cmd}. Type /help for available commands.`);
            }
        } else {
            // Bare text — send to guild chat if enabled
            if (process.env['ENABLE_TERMINAL_CHAT'] === 'true') {
                bridge.bot.chat('gc', input);
                consola.info(`[GC] → ${input}`);
            } else {
                consola.warn('Bare text disabled (ENABLE_TERMINAL_CHAT=false). Use /gc <msg>');
            }
        }

        rl.prompt();
    });

    rl.on('close', () => {
        consola.info('Terminal REPL closed.');
    });
}
