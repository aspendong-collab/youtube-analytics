// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { communicationsService } from '@/services/communications';

// GET /api/v1/communications - 获取沟通记录列表
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const campaignId = url.searchParams.get('campaignId');
    const influencerId = url.searchParams.get('influencerId');
    const status = url.searchParams.get('status');

    const result = await communicationsService.list({
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
    console.error('[Communications] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch communications',
    }, { status: 500 });
  }
}

// POST /api/v1/communications - 创建沟通记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const communication = await communicationsService.create(body);

    return NextResponse.json({
      success: true,
      data: communication,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Communications] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create communication',
    }, { status: 500 });
  }
}
