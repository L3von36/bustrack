import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const start = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.2.0',
      db: { connected: true, latencyMs: dbLatency },
      uptime: process.uptime(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      db: { connected: false, error: 'Database unreachable' },
      uptime: process.uptime(),
    }, { status: 503 });
  }
}