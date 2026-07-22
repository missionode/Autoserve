import { z } from 'zod';

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  WORKER_PORT: z.coerce.number().int().positive().default(3002),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  OBJECT_STORAGE_ENDPOINT: z.string().url(),
  OBJECT_STORAGE_REGION: z.string().min(1),
  OBJECT_STORAGE_BUCKET: z.string().min(3),
  OBJECT_STORAGE_ACCESS_KEY: z.string().min(8),
  OBJECT_STORAGE_SECRET_KEY: z.string().min(16),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  APP_VERSION: z.string().default('development'),
});

const publicSchema = z.object({ NEXT_PUBLIC_API_ORIGIN: z.string().url() });

export type ServerEnvironment = z.infer<typeof serverSchema>;
export type PublicEnvironment = z.infer<typeof publicSchema>;
export const loadServerEnvironment = (source: NodeJS.ProcessEnv): ServerEnvironment =>
  serverSchema.parse(source);
export const loadPublicEnvironment = (source: NodeJS.ProcessEnv): PublicEnvironment =>
  publicSchema.parse(source);
