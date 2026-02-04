import { NextRequest, NextResponse } from 'next/server';
import { influencerCollector } from '@/lib/influencer-collector';
import { youtubeClient } from '@/lib/youtube-client';

/**
 * POST /api/influencers/collect
 * 搜索并采集达人数据
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, maxResults, regionCode } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing required field: keyword' },
        { status: 400 }
      );
    }

    // 检查配额
    const quotaUsage = youtubeClient.getQuotaUsage();
    if (quotaUsage.remaining < 200) {
      return NextResponse.json(
        { error: 'Insufficient quota. Please try again tomorrow.' },
        { status: 429 }
      );
    }

    // 采集达人
    const influencers = await influencerCollector.collectByKeyword(keyword, {
      maxResults: maxResults || 50,
      regionCode: regionCode,
      includeRecentVideos: true,
      recentVideosCount: 10,
    });

    // 返回结果
    return NextResponse.json({
      success: true,
      data: {
        influencers,
        count: influencers.length,
        quotaUsage: youtubeClient.getQuotaUsage(),
      },
    });
  } catch (error) {
    console.error('Collect influencers error:', error);
    return NextResponse.json(
      { error: 'Failed to collect influencers', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/influencers/collect
 * 获取配额使用情况
 */
export async function GET() {
  try {
    const quotaUsage = youtubeClient.getQuotaUsage();
    const cacheStats = youtubeClient.getCacheStats();

    return NextResponse.json({
      success: true,
      data: {
        quotaUsage,
        cacheStats,
      },
    });
  } catch (error) {
    console.error('Get quota usage error:', error);
    return NextResponse.json(
      { error: 'Failed to get quota usage' },
      { status: 500 }
    );
  }
}
