import { NextRequest, NextResponse } from 'next/server';
import { influencerCollector } from '@/lib/influencer-collector';
import { youtubeClient } from '@/lib/youtube-client';

/**
 * POST /api/influencers/collect
 * 搜索并采集达人数据
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API /api/influencers/collect] 收到请求');

    const body = await request.json();
    const { keyword, maxResults, regionCode, page } = body;

    console.log('[API] 请求参数:', { keyword, maxResults, regionCode, page });

    if (!keyword) {
      console.error('[API] 缺少必需参数: keyword');
      return NextResponse.json(
        { error: 'Missing required field: keyword' },
        { status: 400 }
      );
    }

    // 检查环境变量
    if (!process.env.YOUTUBE_API_KEY) {
      console.error('[API] YouTube API Key 未配置');
      return NextResponse.json(
        { error: 'YouTube API Key not configured' },
        { status: 500 }
      );
    }

    // 检查配额
    const quotaUsage = youtubeClient.getQuotaUsage();
    console.log('[API] 配额使用情况:', quotaUsage);

    if (quotaUsage.remaining < 200) {
      console.warn('[API] 配额不足');
      return NextResponse.json(
        { error: 'Insufficient quota. Please try again tomorrow.' },
        { status: 429 }
      );
    }

    console.log('[API] 开始采集达人...');

    // 设置请求超时（60秒）
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      // 采集达人
      const influencers = await influencerCollector.collectByKeyword(keyword, {
        maxResults: maxResults || 50,
        regionCode: regionCode,
        includeRecentVideos: true,
        recentVideosCount: 10,
      });

      clearTimeout(timeout);
      console.log(`[API] 采集完成，找到 ${influencers.length} 个达人`);

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
      clearTimeout(timeout);
      throw error;
    }
  } catch (error) {
    console.error('[API] 采集达人错误:', error);

    // 提取更详细的错误信息
    let errorMessage = 'Failed to collect influencers';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('[API] 错误堆栈:', error.stack);

      // 检查特定错误类型
      if (error.name === 'AbortError') {
        statusCode = 504;
        errorMessage = '采集超时，请稍后重试';
      } else if (errorMessage.includes('Quota exceeded')) {
        statusCode = 429;
        errorMessage = 'API配额已用完，请明天再试';
      } else if (error.message.includes('API key')) {
        statusCode = 500;
        errorMessage = 'YouTube API密钥无效或已过期';
      } else if (error.message.includes('403')) {
        statusCode = 403;
        errorMessage = '访问被拒绝，请检查API权限';
      } else if (error.message.includes('400')) {
        statusCode = 400;
        errorMessage = '请求参数错误';
      } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('ETIMEDOUT')) {
        statusCode = 503;
        errorMessage = '网络连接失败，请稍后重试';
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode
      },
      { status: statusCode }
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
