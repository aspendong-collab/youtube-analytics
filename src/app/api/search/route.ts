import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface YouTubeSearchResult {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  viewCount?: number;
}

interface TrendingResult {
  videos: YouTubeSearchResult[];
  category: string;
}

interface CompetitorResult {
  videos: YouTubeSearchResult[];
  channelId: string;
  channelTitle: string;
}

/**
 * GET - 搜索视频
 * 支持三种模式:
 * 1. keyword - 关键词搜索
 * 2. trending - 热门趋势
 * 3. competitor - 竞品视频
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode') || 'keyword'; // keyword | trending | competitor
  const q = searchParams.get('q') || ''; // 搜索关键词
  const channelId = searchParams.get('channelId'); // 频道ID（竞品模式）
  const categoryId = searchParams.get('categoryId'); // 分类ID（热门趋势）
  const regionCode = searchParams.get('regionCode') || 'US'; // 地区代码
  const maxResults = parseInt(searchParams.get('maxResults') || '50');

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: '未配置 YouTube API Key' },
      { status: 500 }
    );
  }

  try {
    let apiUrl = '';
    let params: any = {
      part: 'snippet',
      type: 'video',
      maxResults: Math.min(maxResults, 50),
      key: apiKey,
      order: 'relevance',
    };

    if (mode === 'keyword') {
      // 关键词搜索
      if (!q) {
        return NextResponse.json(
          { error: '关键词不能为空' },
          { status: 400 }
        );
      }

      params.q = q;
      apiUrl = 'https://www.googleapis.com/youtube/v3/search';
    } else if (mode === 'trending') {
      // 热门趋势
      apiUrl = 'https://www.googleapis.com/youtube/v3/videos';
      delete params.type;
      delete params.q;
      params.chart = 'mostPopular';
      params.regionCode = regionCode;
      if (categoryId) {
        params.videoCategoryId = categoryId;
      }
    } else if (mode === 'competitor') {
      // 竞品视频
      if (!channelId) {
        return NextResponse.json(
          { error: '频道ID不能为空' },
          { status: 400 }
        );
      }

      apiUrl = 'https://www.googleapis.com/youtube/v3/search';
      params.channelId = channelId;
      params.order = 'date';
    } else {
      return NextResponse.json(
        { error: '无效的搜索模式' },
        { status: 400 }
      );
    }

    // 构建URL
    const url = new URL(apiUrl);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    console.log(`[API /api/search] 调用 YouTube Search API:`, {
      mode,
      url: url.toString().replace(/key=[^&]+/, 'key=***'),
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API /api/search] YouTube API 错误:', errorData);

      let errorMessage = '搜索失败';
      if (response.status === 401) {
        errorMessage = 'API Key 无效或已过期';
      } else if (response.status === 403) {
        errorMessage = 'API Key 权限不足或配额已用尽';
      } else if (response.status === 429) {
        errorMessage = '请求过于频繁，请稍后重试';
      }

      return NextResponse.json(
        { error: errorMessage, statusCode: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({
        videos: [],
        total: 0,
        message: '未找到相关视频',
      });
    }

    // 获取视频ID列表，用于获取统计数据
    const videoIds = data.items.map((item: any) =>
      item.id.videoId || item.id
    ).join(',');

    // 获取视频统计数据
    let videosWithStats: YouTubeSearchResult[] = [];

    if (videoIds) {
      const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      statsUrl.searchParams.append('part', 'statistics');
      statsUrl.searchParams.append('id', videoIds);
      statsUrl.searchParams.append('key', apiKey);

      const statsResponse = await fetch(statsUrl.toString());
      const statsData = await statsResponse.json();

      const statsMap = new Map();
      if (statsData.items) {
        statsData.items.forEach((item: any) => {
          statsMap.set(item.id, item.statistics);
        });
      }

      videosWithStats = data.items.map((item: any) => {
        const videoId = item.id.videoId || item.id;
        const snippet = item.snippet;
        const stats = statsMap.get(videoId);

        return {
          id: videoId,
          title: snippet.title,
          description: snippet.description || '',
          thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
          publishedAt: snippet.publishedAt,
          channelId: snippet.channelId,
          channelTitle: snippet.channelTitle,
          viewCount: stats?.viewCount ? parseInt(stats.viewCount) : 0,
        };
      });
    }

    // 根据模式返回不同格式的数据
    if (mode === 'trending') {
      return NextResponse.json({
        videos: videosWithStats,
        category: categoryId || 'All',
        regionCode,
      } as TrendingResult);
    } else if (mode === 'competitor') {
      const channelInfo = videosWithStats[0]?.channelId
        ? { channelId: videosWithStats[0].channelId, channelTitle: videosWithStats[0].channelTitle }
        : null;

      return NextResponse.json({
        videos: videosWithStats,
        ...channelInfo,
      } as CompetitorResult);
    } else {
      return NextResponse.json({
        videos: videosWithStats,
        total: videosWithStats.length,
        query: q,
      });
    }

  } catch (error) {
    console.error('[API /api/search] 服务器错误:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        hint: '请稍后重试',
      },
      { status: 500 }
    );
  }
}
