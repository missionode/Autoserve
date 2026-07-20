import pino from 'pino';

export const createLogger = (service: string, level = 'info') =>
  pino({
    level,
    base: { service, environment: process.env.APP_ENV ?? 'development' },
    redact: ['password', 'authorization', 'cookie', '*.password', '*.token', '*.secret'],
    timestamp: pino.stdTimeFunctions.isoTime,
  });

export const correlationId = (incoming?: string): string =>
  incoming?.trim() || crypto.randomUUID();
