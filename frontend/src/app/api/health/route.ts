/**
 * API Route Handler (Placeholder)
 *
 * Example API route for health checks.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
