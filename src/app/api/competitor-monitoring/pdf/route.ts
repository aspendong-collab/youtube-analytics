import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface CompetitorVideo {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  competitorName: string;
  competitorId: string;
  mentionType: string;
  relevanceScore: number;
  // 统计数据
  viewCount: number;
  likeCount: number;
  commentCount: number;
  viewsAtDetection: number;
  viewsGrowth: number;
  growthRate: number;
  firstDetectedAt: string;
  lastDetectedAt: string;
  // 计算指标
  engagementRate: number;
  daysSincePublished: number;
}

interface CompetitorMonitoringResponse {
  competitors: Array<{
    id: string;
    name: string;
    slug: string;
    videoCount: number;
  }>;
  videos: CompetitorVideo[];
  total: number;
  timestamp: string;
}

/**
 * 获取PDF软件监控数据
 *
 * 支持的参数：
 * - competitorSlug: 竞品标识符（可选，如：pdfelement, foxit-pdf）
 * - timeRange: 时间范围（1d, 7d, 30d，默认7d）
 * - sortBy: 排序方式（views, growth, engagement, relevance，默认views）
 * - orderBy: 排序顺序（asc, desc，默认desc）
 * - limit: 返回数量（默认50）
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const competitorSlug = searchParams.get('competitorSlug') || '';
  const timeRange = searchParams.get('timeRange') || '7d';
  const sortBy = searchParams.get('sortBy') || 'views';
  const orderBy = searchParams.get('orderBy') || 'desc';
  const limit = parseInt(searchParams.get('limit') || '50');

  const apiKey = process.env.YOUTUBE_API_KEY;

  console.log('[竞品监控API] 请求参数:', {
    competitorSlug,
    timeRange,
    sortBy,
    orderBy,
    limit,
  });

  if (!apiKey) {
    return NextResponse.json(
      { error: '未配置 YouTube API Key' },
      { status: 500 }
    );
  }

  try {
    // 定义PDF软件竞品
    const pdfCompetitors = [
      { id: '1', name: 'PDFelement', slug: 'pdfelement', keywords: ['PDFelement', 'Wondershare PDFelement'] },
      { id: '2', name: 'Foxit PDF', slug: 'foxit-pdf', keywords: ['Foxit PDF', 'Foxit Editor', 'Foxit Phantom'] },
      { id: '3', name: 'PDFgear', slug: 'pdfgear', keywords: ['PDFgear', 'PDFgear Desktop'] },
      { id: '4', name: 'UPDF', slug: 'updf', keywords: ['UPDF', 'Superace UPDF'] },
    ];

    // 根据slug筛选竞品
    const selectedCompetitors = competitorSlug
      ? pdfCompetitors.filter(c => c.slug === competitorSlug)
      : pdfCompetitors;

    if (selectedCompetitors.length === 0) {
      return NextResponse.json(
        { error: '未找到指定的竞品' },
        { status: 404 }
      );
    }

    // 计算时间范围
    const now = new Date();
    let publishedAfter: Date;

    if (timeRange === '1d') {
      publishedAfter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeRange === '7d') {
      publishedAfter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '30d') {
      publishedAfter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      publishedAfter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    console.log('[竞品监控API] 监控时间范围:', publishedAfter.toISOString(), '至', now.toISOString());

    // 收集所有视频
    const allVideos: Map<string, any> = new Map();
    const videoCompetitorMap: Map<string, string> = new Map();

    // 为每个竞品搜索视频
    for (const competitor of selectedCompetitors) {
      for (const keyword of competitor.keywords) {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(keyword)}&order=viewCount&publishedAfter=${publishedAfter.toISOString()}&maxResults=25&key=${apiKey}`;

        console.log(`[竞品监控API] 搜索竞品 ${competitor.name} 关键词 "${keyword}":`, searchUrl.replace(/key=[^&]+/, 'key=***'));

        const searchResponse = await fetch(searchUrl, {
          signal: AbortSignal.timeout(15000),
        });

        if (!searchResponse.ok) {
          console.warn(`[竞品监控API] 竞品 ${competitor.name} 关键词 "${keyword}" 搜索失败:`, searchResponse.status);
          continue;
        }

        const searchData = await searchResponse.json();

        if (searchData.items) {
          searchData.items.forEach((item: any) => {
            const videoId = item.id.videoId || item.id;
            allVideos.set(videoId, item);
            videoCompetitorMap.set(videoId, competitor.name);
          });
        }
      }
    }

    console.log('[竞品监控API] 找到视频数:', allVideos.size);

    if (allVideos.size === 0) {
      return NextResponse.json({
        competitors: selectedCompetitors.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          videoCount: 0,
        })),
        videos: [],
        total: 0,
        timestamp: now.toISOString(),
      } as CompetitorMonitoringResponse);
    }

    // 批量获取视频详情
    const videoIds = Array.from(allVideos.keys());
    const videosParams = new URLSearchParams({
      part: 'statistics,contentDetails,snippet',
      id: videoIds.join(','),
      key: apiKey,
    });

    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`;
    console.log('[竞品监控API] 获取视频详情:', videosUrl.replace(/key=[^&]+/, 'key=***'));

    const videosResponse = await fetch(videosUrl, {
      signal: AbortSignal.timeout(15000),
    });

    if (!videosResponse.ok) {
      throw new Error(`获取视频详情失败: ${videosResponse.status}`);
    }

    const videosData = await videosResponse.json();

    // 构建频道ID集合
    const channelIds = new Set<string>();
    videosData.items?.forEach((item: any) => {
      channelIds.add(item.snippet.channelId);
    });

    // 批量获取频道信息
    const channelsParams = new URLSearchParams({
      part: 'statistics,snippet',
      id: Array.from(channelIds).join(','),
      key: apiKey,
    });

    const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?${channelsParams.toString()}`;
    console.log('[竞品监控API] 获取频道详情:', channelsUrl.replace(/key=[^&]+/, 'key=***'));

    const channelsResponse = await fetch(channelsUrl, {
      signal: AbortSignal.timeout(15000),
    });

    if (!channelsResponse.ok) {
      throw new Error(`获取频道详情失败: ${channelsResponse.status}`);
    }

    const channelsData = await channelsResponse.json();

    // 构建数据映射
    const channelMap = new Map<string, any>();
    channelsData.items?.forEach((channel: any) => {
      channelMap.set(channel.id, {
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        title: channel.snippet.title,
      });
    });

    // 构建视频数据
    const videos: CompetitorVideo[] = [];

    for (const item of videosData.items || []) {
      const videoId = item.id;
      const snippet = item.snippet;
      const statistics = item.statistics;
      const channel = channelMap.get(snippet.channelId);

      if (!channel) continue;

      const viewCount = parseInt(statistics.viewCount) || 0;
      const likeCount = parseInt(statistics.likeCount) || 0;
      const commentCount = parseInt(statistics.commentCount) || 0;

      // 计算互动率
      const engagementRate = viewCount > 0
        ? ((likeCount + commentCount) / viewCount) * 100
        : 0;

      // 计算发布天数
      const publishedAt = new Date(snippet.publishedAt);
      const daysSincePublished = Math.floor((now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));

      // 计算相关性评分（简单实现：标题和描述中是否包含竞品关键词）
      let relevanceScore = 0;
      const title = snippet.title.toLowerCase();
      const description = (snippet.description || '').toLowerCase();

      for (const competitor of selectedCompetitors) {
        for (const keyword of competitor.keywords) {
          if (title.includes(keyword.toLowerCase()) || description.includes(keyword.toLowerCase())) {
            relevanceScore = Math.max(relevanceScore, 1.0);
          }
        }
      }

      // 确定提及类型
      let mentionType = 'unknown';
      const titleLower = snippet.title.toLowerCase();
      const descriptionLower = (snippet.description || '').toLowerCase();
      const tags = snippet.tags || [];

      let hasTitle = false;
      let hasDescription = false;
      let hasTag = false;

      for (const competitor of selectedCompetitors) {
        for (const keyword of competitor.keywords) {
          const kwLower = keyword.toLowerCase();
          if (titleLower.includes(kwLower)) hasTitle = true;
          if (descriptionLower.includes(kwLower)) hasDescription = true;
          if (tags.some((t: string) => t.toLowerCase().includes(kwLower))) hasTag = true;
        }
      }

      if (hasTitle && hasDescription && hasTag) {
        mentionType = 'all';
      } else if (hasTitle) {
        mentionType = 'title';
      } else if (hasDescription) {
        mentionType = 'description';
      } else if (hasTag) {
        mentionType = 'tag';
      }

      videos.push({
        id: videoId,
        videoId: videoId,
        title: snippet.title,
        description: snippet.description || '',
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
        publishedAt: snippet.publishedAt,
        channelId: snippet.channelId,
        channelTitle: snippet.channelTitle,
        competitorName: videoCompetitorMap.get(videoId) || '',
        competitorId: selectedCompetitors.find(c => c.name === videoCompetitorMap.get(videoId))?.id || '',
        mentionType,
        relevanceScore,
        viewCount,
        likeCount,
        commentCount,
        viewsAtDetection: viewCount, // 简化处理：假设检测时就是当前播放量
        viewsGrowth: 0, // 需要历史数据才能计算
        growthRate: 0, // 需要历史数据才能计算
        firstDetectedAt: publishedAt.toISOString(),
        lastDetectedAt: now.toISOString(),
        engagementRate,
        daysSincePublished,
      });
    }

    // 排序
    videos.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'views':
          comparison = b.viewCount - a.viewCount;
          break;
        case 'growth':
          comparison = b.viewsGrowth - a.viewsGrowth;
          break;
        case 'engagement':
          comparison = b.engagementRate - a.engagementRate;
          break;
        case 'relevance':
          comparison = b.relevanceScore - a.relevanceScore;
          break;
        default:
          comparison = b.viewCount - a.viewCount;
      }

      return orderBy === 'asc' ? -comparison : comparison;
    });

    // 限制返回数量
    const limitedVideos = videos.slice(0, limit);

    // 统计每个竞品的视频数
    const competitorStats = selectedCompetitors.map(competitor => ({
      id: competitor.id,
      name: competitor.name,
      slug: competitor.slug,
      videoCount: videos.filter(v => v.competitorName === competitor.name).length,
    }));

    const response: CompetitorMonitoringResponse = {
      competitors: competitorStats,
      videos: limitedVideos,
      total: videos.length,
      timestamp: now.toISOString(),
    };

    console.log('[竞品监控API] 返回结果:', {
      competitors: competitorStats.length,
      videos: limitedVideos.length,
      total: videos.length,
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('[竞品监控API] 错误:', error);
    return NextResponse.json(
      {
        error: '获取竞品监控数据失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
