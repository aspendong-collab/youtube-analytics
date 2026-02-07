// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/services/analytics';

// GET /api/v1/analytics/campaigns - 获取活动分析数据
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({
        success: false,
        error: 'campaignId is required',
      }, { status: 400 });
    }

    const analytics = await analyticsService.getCampaignAnalytics(campaignId);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error('[Analytics/Campaigns] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch campaign analytics',
    }, { status: 500 });
  }
}
