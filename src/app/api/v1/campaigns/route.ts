// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { campaignsService } from '@/services/campaigns';

// GET /api/v1/campaigns - 获取营销活动列表
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const status = url.searchParams.get('status');

    const result = await campaignsService.list({
      page,
      pageSize,
      filters: status ? { status } : undefined,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Campaigns] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch campaigns',
    }, { status: 500 });
  }
}

// POST /api/v1/campaigns - 创建营销活动
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const campaign = await campaignsService.create(body);

    return NextResponse.json({
      success: true,
      data: campaign,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Campaigns] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create campaign',
    }, { status: 500 });
  }
}
