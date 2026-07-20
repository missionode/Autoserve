import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { loadServerEnvironment } from '@autoserve/configuration';
import { createLogger } from '@autoserve/observability';
import { AppModule } from './app.module.js';

const environment = loadServerEnvironment(process.env);
const logger = createLogger('api', environment.LOG_LEVEL);
const app = await NestFactory.create(AppModule, { logger: false });
app.setGlobalPrefix('api/v1');
app.enableShutdownHooks();
await app.listen(environment.API_PORT, '0.0.0.0');
logger.info({ port: environment.API_PORT }, 'api started');
