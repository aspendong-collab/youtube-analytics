import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface YouTubeSearchVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  // 视频统计数据
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string; // ISO 8601 格式，如 "PT10M30S"
  durationSeconds: number; // 转换为秒
  // 频道统计数据
  subscriberCount: number;
  channelVideoCount: number;
  // 计算指标
  engagementRate: number; // 互动率 = (点赞+评论)/播放量 * 100
  engagementScore: number; // 综合互动评分
  popularityScore: number; // 综合热度评分
  daysSincePublished: number; // 发布天数
}

interface SearchResponse {
  videos: YouTubeSearchVideo[];
  total: number;
  query?: string;
  filters?: {
    viewCount: [number, number];
    engagementRate: [number, number];
    daysSincePublished: [number, number];
  };
}

/**
 * GET - 搜索视频（增强版，返回完整统计数据）
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode') || 'keyword';
  const q = searchParams.get('q') || '';
  const channelId = searchParams.get('channelId');
  const categoryId = searchParams.get('categoryId');
  const regionCode = searchParams.get('regionCode') || 'US';
  const maxResults = parseInt(searchParams.get('maxResults') || '50');
  const order = searchParams.get('order') || 'relevance'; // relevance, date, viewCount, rating

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: '未配置 YouTube API Key' },
      { status: 500 }
    );
  }

  try {
    // 步骤1：搜索视频
    const searchParams = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      maxResults: Math.min(maxResults, 50).toString(),
      key: apiKey,
      order,
    });

    if (mode === 'keyword' && q) {
      searchParams.append('q', q);
    } else if (mode === 'trending') {
      searchParams.append('chart', 'mostPopular');
      searchParams.append('regionCode', regionCode);
      if (categoryId) searchParams.append('videoCategoryId', categoryId);
    } else if (mode === 'competitor' && channelId) {
      searchParams.append('channelId', channelId);
      searchParams.append('order', 'date');
    } else {
      return NextResponse.json(
        { error: '无效的搜索参数' },
        { status: 400 }
      );
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`;
    console.log(`[搜索API] 搜索视频: ${searchUrl.replace(/key=[^&]+/, 'key=***')}`);

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({
        videos: [],
        total: 0,
        message: '未找到相关视频',
      } as SearchResponse);
    }

    // 步骤2：提取 videoIds 和 channelIds
    const videoIds: string[] = [];
    const channelIds: Set<string> = new Set();

    searchData.items.forEach((item: any) => {
      const videoId = item.id.videoId || item.id;
      videoIds.push(videoId);
      channelIds.add(item.snippet.channelId);
    });

    // 步骤3：批量获取视频详情（统计数据 + 时长）
    const videosParams = new URLSearchParams({
      part: 'statistics,contentDetails,snippet',
      id: videoIds.join(','),
      key: apiKey,
    });

    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`;
    const videosResponse = await fetch(videosUrl);
    const videosData = await videosResponse.json();

    // 步骤4：批量获取频道详情
    const channelsParams = new URLSearchParams({
      part: 'statistics,snippet',
      id: Array.from(channelIds).join(','),
      key: apiKey,
    });

    const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?${channelsParams.toString()}`;
    const channelsResponse = await fetch(channelsUrl);
    const channelsData = await channelsResponse.json();

    // 步骤5：构建数据映射
    const videosMap = new Map<string, any>();
    if (videosData.items) {
      videosData.items.forEach((item: any) => {
        videosMap.set(item.id, item);
      });
    }

    const channelsMap = new Map<string, any>();
    if (channelsData.items) {
      channelsData.items.forEach((item: any) => {
        channelsMap.set(item.id, item);
      });
    }

    // 步骤6：组合数据并计算指标
    const videos: YouTubeSearchVideo[] = searchData.items.map((item: any) => {
      const videoId = item.id.videoId || item.id;
      const snippet = item.snippet;
      const videoDetails = videosMap.get(videoId);
      const channelDetails = channelsMap.get(snippet.channelId);

      const statistics = videoDetails?.statistics || {};
      const contentDetails = videoDetails?.contentDetails || {};
      const channelStats = channelDetails?.statistics || {};

      // 解析时长
      const duration = contentDetails.duration || 'PT0S';
      const durationSeconds = parseDuration(duration);

      // 计算互动率
      const viewCount = parseInt(statistics.viewCount || '0');
      const likeCount = parseInt(statistics.likeCount || '0');
      const commentCount = parseInt(statistics.commentCount || '0');
      const engagementRate = viewCount > 0
        ? ((likeCount + commentCount) / viewCount) * 100
        : 0;

      // 计算互动评分（0-100）
      const engagementScore = Math.min(engagementRate * 10, 100);

      // 计算热度评分（综合播放量、互动率、发布时间）
      const publishedAt = new Date(snippet.publishedAt);
      const daysSincePublished = Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
      const popularityScore = calculatePopularityScore(
        viewCount,
        engagementRate,
        daysSincePublished
      );

      return {
        id: videoId,
        title: snippet.title,
        description: snippet.description || '',
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        publishedAt: snippet.publishedAt,
        channelId: snippet.channelId,
        channelTitle: snippet.channelTitle,
        // 视频统计数据
        viewCount,
        likeCount,
        commentCount,
        duration,
        durationSeconds,
        // 频道统计数据
        subscriberCount: parseInt(channelStats.subscriberCount || '0'),
        channelVideoCount: parseInt(channelStats.videoCount || '0'),
        // 计算指标
        engagementRate: Math.round(engagementRate * 100) / 100,
        engagementScore: Math.round(engagementScore),
        popularityScore: Math.round(popularityScore),
        daysSincePublished,
      };
    });

    return NextResponse.json({
      videos,
      total: videos.length,
      query: q,
    } as SearchResponse);

  } catch (error) {
    console.error('[搜索API] 错误:', error);
    return NextResponse.json(
      { error: '搜索失败', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * 解析 ISO 8601 时长格式为秒数
 * PT10M30S -> 630秒
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * 计算热度评分（0-100）
 * 综合考虑播放量、互动率、发布时间
 */
function calculatePopularityScore(
  viewCount: number,
  engagementRate: number,
  daysSincePublished: number
): number {
  // 播放量评分（对数缩放）
  let viewScore = 0;
  if (viewCount > 0) {
    const logViews = Math.log10(viewCount);
    // 1000播放=20分，1M播放=60分，100M播放=80分
    viewScore = Math.min((logViews - 3) * 20, 80);
  }

  // 互动率评分
  const engagementScore = Math.min(engagementRate * 10, 100);

  // 时间衰减（新视频加权）
  let timeScore = 100;
  if (daysSincePublished > 0) {
    // 30天内：100-60分
    // 90天内：60-40分
    // 90天以上：40-20分
    if (daysSincePublished <= 30) {
      timeScore = 100 - (daysSincePublished / 30) * 40;
    } else if (daysSincePublished <= 90) {
      timeScore = 60 - ((daysSincePublished - 30) / 60) * 20;
    } else {
      timeScore = 40 - Math.min((daysSincePublished - 90) / 365 * 20, 20);
    }
  }

  // 综合评分（权重：播放量40% + 互动率30% + 时间30%）
  const totalScore = (viewScore * 0.4) + (engagementScore * 0.3) + (timeScore * 0.3);

  return Math.max(0, Math.min(totalScore, 100));
}
