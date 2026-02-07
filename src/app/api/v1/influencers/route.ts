// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { influencersService } from '@/services/influencers';

// GET /api/v1/influencers - 搜索达人
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const query = url.searchParams.get('q') || '';
    const scoreTier = url.searchParams.get('scoreTier') as any;
    const channelCategory = url.searchParams.get('channelCategory');

    const result = await influencersService.list({
      page,
      pageSize,
      filters: {
        query,
        scoreTier,
        channelCategory,
      },
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Influencers] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch influencers',
    }, { status: 500 });
  }
}
