import { consola } from 'consola';
import Bridge from '@/bridge/bridge';
import { createApiServer } from '@/api/server';
import { startTerminalRepl } from '@/terminal/index';

async function main() {
    const bridge = new Bridge();
    await bridge.start();

    const api = createApiServer(bridge);
    await api.start();

    startTerminalRepl(bridge);

    const shutdown = async () => {
        consola.info('Received shutdown signal...');
        await bridge.shutdown();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (err) => consola.error('Uncaught exception:', err));
    process.on('unhandledRejection', (err) => consola.error('Unhandled rejection:', err));
}

main().catch((err) => {
    consola.fatal('Failed to start:', err);
    process.exit(1);
});
