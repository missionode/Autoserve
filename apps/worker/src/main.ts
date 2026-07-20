import { loadServerEnvironment } from '@autoserve/configuration';
import { createLogger } from '@autoserve/observability';

const environment = loadServerEnvironment(process.env);
const logger = createLogger('worker', environment.LOG_LEVEL);
logger.info({ health: 'ok', version: process.env.APP_VERSION ?? 'development' }, 'worker started');

const shutdown = (signal: string): void => { logger.info({ signal }, 'worker stopped'); process.exit(0); };
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
