import { describe, expect, it } from 'vitest';
import { serviceHealthSchema } from '@autoserve/contracts';

describe('foundation contract', () => {
  it('accepts the shared health response', () => {
    expect(
      serviceHealthSchema.parse({
        service: 'api',
        status: 'ok',
        environment: 'test',
        version: 'test',
        timestamp: '2026-07-20T00:00:00.000Z',
        correlationId: 'test',
      }).status,
    ).toBe('ok');
  });
});
