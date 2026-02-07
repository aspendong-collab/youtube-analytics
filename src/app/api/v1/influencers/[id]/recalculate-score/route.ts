// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { influencersService } from '@/services/influencers';

// POST /api/v1/influencers/[id]/recalculate-score - 重新计算达人评分
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await influencersService.recalculateScore(params.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Influencers/[id]/recalculate-score] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to recalculate score',
    }, { status: 500 });
  }
}
