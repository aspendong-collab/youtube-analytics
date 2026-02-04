import { NextRequest, NextResponse } from 'next/server';
import { influencerCollector } from '@/lib/influencer-collector';
import { youtubeClient } from '@/lib/youtube-client';
import { influencerCacheService } from '@/lib/influencer-cache';

/**
 * POST /api/influencers/collect
 * 搜索并采集达人数据
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API /api/influencers/collect] 收到请求');

    const body = await request.json();
    const { keyword, keywords, language, maxResults, regionCode, pageToken, publishedAfter, publishedBefore, sortBy } = body;

    // 支持旧的 keyword 参数和新的 keywords 数组
    const searchKeywords = Array.isArray(keywords) ? keywords : (keyword ? [keyword] : []);
    
    console.log('[API] 请求参数:', { 
      keywords: searchKeywords, 
      language, 
      maxResults, 
      regionCode, 
      pageToken,
      publishedAfter,
      publishedBefore,
      sortBy
    });

    if (searchKeywords.length === 0) {
      console.error('[API] 缺少必需参数: keywords');
      return NextResponse.json(
        { error: 'Missing required field: keywords' },
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
      // 将多个关键词用 OR 连接
      const searchQuery = searchKeywords.join(' | ');
      
      console.log('[API] 搜索查询:', searchQuery);

      // 采集达人（支持分页和时间维度）
      const result = await influencerCollector.collectByKeyword(searchQuery, {
        maxResults: maxResults || 50,
        regionCode: regionCode,
        relevanceLanguage: language !== 'all' ? language : undefined,
        order: sortBy || 'relevance',
        pageToken: pageToken,
        publishedAfter: publishedAfter,
        publishedBefore: publishedBefore,
        includeRecentVideos: true,
        recentVideosCount: 10,
      });

      clearTimeout(timeout);
      console.log(`[API] 采集完成，找到 ${result.profiles.length} 个达人`);
      console.log(`[API] 下一页 token: ${result.nextPageToken}`);
      console.log(`[API] 总结果数: ${result.totalResults}`);

      // 根据排序方式对结果进行排序
      let sortedInfluencers = [...result.profiles];
      
      if (sortBy === 'viewCount') {
        sortedInfluencers.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      } else if (sortBy === 'date') {
        sortedInfluencers.sort((a, b) => 
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
      } else if (sortBy === 'rating') {
        sortedInfluencers.sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0));
      } else if (sortBy === 'views') {
        sortedInfluencers.sort((a, b) => (b.avgViews || 0) - (a.avgViews || 0));
      }
      // relevance 使用默认顺序

      // 返回结果
      return NextResponse.json({
        success: true,
        data: {
          influencers: sortedInfluencers,
          count: sortedInfluencers.length,
          nextPageToken: result.nextPageToken, // 下一页 token
          totalResults: result.totalResults, // 总结果数
          hasMore: !!result.nextPageToken, // 是否有更多
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
 * 获取配额使用情况和缓存统计
 */
export async function GET(request: NextRequest) {
  try {
    const quotaUsage = youtubeClient.getQuotaUsage();
    const cacheStats = youtubeClient.getCacheStats();
    
    // 获取数据库缓存统计
    const dbCacheStats = await influencerCacheService.getStats();

    return NextResponse.json({
      success: true,
      data: {
        quotaUsage,
        cacheStats: {
          memory: cacheStats,
          database: dbCacheStats,
        },
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
