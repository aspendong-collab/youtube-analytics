import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  return NextResponse.json({
    environment: process.env.NODE_ENV || 'unknown',
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPrefix: apiKey?.substring(0, 10) + '...',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('YOUTUBE')),
    vercelEnv: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString(),
  });
}
