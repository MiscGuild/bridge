import { consola } from 'consola';
import Bridge from './bridge';

const bridge = new Bridge();

const handleShutdown = async () => {
    await bridge.shutdown();
    process.exit(0);
};

const handleError = (e: Error) => consola.error(e);

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);

export default bridge;
