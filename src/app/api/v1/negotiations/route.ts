// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { negotiationsService } from '@/services/negotiations';

// GET /api/v1/negotiations - 获取谈判记录列表
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const campaignId = url.searchParams.get('campaignId');
    const influencerId = url.searchParams.get('influencerId');
    const status = url.searchParams.get('status');

    const result = await negotiationsService.list({
      page,
      pageSize,
      filters: {
        campaignId: campaignId || undefined,
        influencerId: influencerId || undefined,
        status: status as any,
      },
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Negotiations] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch negotiations',
    }, { status: 500 });
  }
}

// POST /api/v1/negotiations - 创建谈判记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const negotiation = await negotiationsService.create(body);

    return NextResponse.json({
      success: true,
      data: negotiation,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Negotiations] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create negotiation',
    }, { status: 500 });
  }
}
