import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await query('SELECT 1 as healthy');
    return NextResponse.json({
      status: 'ok',
      database: res.rows[0]?.healthy === 1 ? 'connected' : 'unknown',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error.message || 'Database unreachable',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
