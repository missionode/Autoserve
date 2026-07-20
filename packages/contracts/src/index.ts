import { z } from 'zod';

export const serviceHealthSchema = z.object({
  service: z.enum(['web', 'api', 'worker']),
  status: z.enum(['ok', 'degraded']),
  environment: z.string().min(1),
  version: z.string().min(1),
  timestamp: z.string().datetime(),
  correlationId: z.string().min(1),
});

export type ServiceHealth = z.infer<typeof serviceHealthSchema>;
