import { NextResponse } from 'next/server';

// 强制动态路由
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
