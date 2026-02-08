// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * 检查环境变量 API
 * GET /api/v1/test/check-env
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Set: ' + process.env.RESEND_API_KEY.substring(0, 10) + '...' : 'Not Set',
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  });
}
