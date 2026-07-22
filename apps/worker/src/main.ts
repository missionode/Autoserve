import { loadServerEnvironment } from '@autoserve/configuration';
import { createLogger } from '@autoserve/observability';
import { createServer } from 'node:http';

const environment = loadServerEnvironment(process.env);
const logger = createLogger('worker', environment.LOG_LEVEL);
logger.info({ health: 'ok', version: process.env.APP_VERSION ?? 'development' }, 'worker started');

const server = createServer((request, response) => {
  if (request.url !== '/health') {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(
    JSON.stringify({
      service: 'worker',
      status: 'ok',
      environment: environment.APP_ENV,
      version: process.env.APP_VERSION ?? 'development',
      timestamp: new Date().toISOString(),
      correlationId: crypto.randomUUID(),
    }),
  );
});
server.listen(environment.WORKER_PORT, '0.0.0.0');

const shutdown = (signal: string): void => {
  logger.info({ signal }, 'worker stopped');
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
