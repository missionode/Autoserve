import { Controller, Get, Headers } from '@nestjs/common';
import { correlationId } from '@autoserve/observability';
import type { ServiceHealth } from '@autoserve/contracts';

@Controller('health')
export class HealthController {
  @Get()
  health(@Headers('x-correlation-id') incoming?: string): ServiceHealth {
    return {
      service: 'api', status: 'ok', environment: process.env.APP_ENV ?? 'development',
      version: process.env.APP_VERSION ?? 'development', timestamp: new Date().toISOString(),
      correlationId: correlationId(incoming),
    };
  }
}
