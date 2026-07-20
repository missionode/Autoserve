import { NextResponse } from 'next/server';
import type { ServiceHealth } from '@autoserve/contracts';
export function GET(): NextResponse<ServiceHealth> {
  return NextResponse.json({ service: 'web', status: 'ok', environment: process.env.APP_ENV ?? 'development', version: process.env.APP_VERSION ?? 'development', timestamp: new Date().toISOString(), correlationId: crypto.randomUUID() });
}
