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
    const { keyword, keywords, language, maxResults, regionCode, page, sortBy } = body;

    // 支持旧的 keyword 参数和新的 keywords 数组
    const searchKeywords = Array.isArray(keywords) ? keywords : (keyword ? [keyword] : []);
    
    console.log('[API] 请求参数:', { 
      keywords: searchKeywords, 
      language, 
      maxResults, 
      regionCode, 
      page,
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

      // 计算 offset：如果指定了 page，跳过前面的结果
      const currentPage = page || 1;
      const resultsPerPage = maxResults || 20;
      const offset = (currentPage - 1) * resultsPerPage;

      // 采集达人
      const allInfluencers = await influencerCollector.collectByKeyword(searchQuery, {
        maxResults: (resultsPerPage * 2) + 20, // 多采集一些，确保有足够的数据
        regionCode: regionCode,
        relevanceLanguage: language !== 'all' ? language : undefined,
        order: sortBy || 'relevance',
        includeRecentVideos: true,
        recentVideosCount: 10,
      });

      clearTimeout(timeout);
      console.log(`[API] 采集完成，找到 ${allInfluencers.length} 个达人`);

      // 根据 page 参数分页
      let influencers = allInfluencers;
      if (offset > 0 && offset < allInfluencers.length) {
        influencers = allInfluencers.slice(offset, offset + resultsPerPage);
      } else if (offset >= allInfluencers.length) {
        influencers = [];
      } else {
        influencers = allInfluencers.slice(0, resultsPerPage);
      }

      console.log(`[API] 分页后返回 ${influencers.length} 个达人（page=${currentPage}, offset=${offset}, limit=${resultsPerPage}, total=${allInfluencers.length}）`);

      // 根据排序方式对结果进行排序
      let sortedInfluencers = [...influencers];
      
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
          total: allInfluencers.length, // 总数（用于判断是否还有更多）
          page: currentPage,
          hasMore: offset + resultsPerPage < allInfluencers.length,
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
