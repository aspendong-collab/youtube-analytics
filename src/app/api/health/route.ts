import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set (hidden)' : 'Not set',
    },
  });
}
