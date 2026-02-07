// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/services/analytics';

// GET /api/v1/analytics/trends - 获取趋势分析数据
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');
    const period = url.searchParams.get('period') || '7d';

    const trends = await analyticsService.getTrends({
      campaignId: campaignId || undefined,
      period: period as '7d' | '30d' | '90d',
    });

    return NextResponse.json({
      success: true,
      data: trends,
    });
  } catch (error: any) {
    console.error('[Analytics/Trends] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch trends analytics',
    }, { status: 500 });
  }
}
