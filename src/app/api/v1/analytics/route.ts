// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/services/analytics';

// GET /api/v1/analytics - 获取通用分析数据
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'overview';

    const analytics = await analyticsService.getOverview(type);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error('[Analytics] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch analytics',
    }, { status: 500 });
  }
}
