import { NextRequest, NextResponse } from 'next/server';
import { influencerCacheService } from '@/lib/influencer-cache';

/**
 * POST /api/influencers/cache/clean
 * 清理过期缓存
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API /api/influencers/cache/clean] 清理过期缓存...');

    const result = await influencerCacheService.cleanExpired();

    console.log(`[API /api/influencers/cache/clean] 清理完成: ${result} 条记录`);

    return NextResponse.json({
      success: true,
      data: {
        cleanedCount: result,
      },
    });
  } catch (error) {
    console.error('[API /api/influencers/cache/clean] 清理失败:', error);

    return NextResponse.json(
      {
        error: 'Failed to clean expired cache',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/influencers/cache/clean
 * 获取缓存统计
 */
export async function GET() {
  try {
    console.log('[API /api/influencers/cache/clean] 获取缓存统计...');

    const stats = await influencerCacheService.getStats();

    console.log(`[API /api/influencers/cache/clean] 缓存统计:`, stats);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[API /api/influencers/cache/clean] 获取统计失败:', error);

    return NextResponse.json(
      {
        error: 'Failed to get cache stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
