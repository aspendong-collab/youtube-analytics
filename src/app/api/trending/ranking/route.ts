import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface TrendingVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  subscriberCount: number;
  // 统计数据
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  durationSeconds: number;
  // 计算指标
  engagementRate: number;
  engagementScore: number;
  popularityScore: number;
  daysSincePublished: number;
  // 排行榜指标
  trendRank: number; // 趋势排名
  trendScore: number; // 趋势分数
}

interface TrendingResponse {
  period: 'today' | 'week' | 'month';
  keywords: string[];
  videos: TrendingVideo[];
  total: number;
  timestamp: string;
}

/**
 * 获取热门内容排行榜
 *
 * 支持的参数：
 * - period: 时间范围（today/week/month）
 * - keywords: 关键词（逗号分隔，如：科技,评测）
 * - regionCode: 地区代码（默认 US）
 * - maxResults: 最大结果数（默认 50）
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || 'today';
  const keywords = searchParams.get('keywords') || '';
  const regionCode = searchParams.get('regionCode') || 'US';
  const maxResults = parseInt(searchParams.get('maxResults') || '50');

  const apiKey = process.env.YOUTUBE_API_KEY;

  console.log('[热门排行榜API] 请求参数:', { period, keywords, maxResults, regionCode });

  if (!apiKey) {
    return NextResponse.json(
      { error: '未配置 YouTube API Key' },
      { status: 500 }
    );
  }

  try {
    // 解析关键词
    const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
    console.log('[热门排行榜API] 关键词列表:', keywordList);

    // 计算时间范围
    const now = new Date();
    let publishedAfter: Date;

    if (period === 'today') {
      // 今日：从今天 00:00:00 开始
      publishedAfter = new Date(now);
      publishedAfter.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      // 本周：从本周一开始
      const dayOfWeek = now.getDay();
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      publishedAfter = new Date(now);
      publishedAfter.setDate(now.getDate() - daysSinceMonday);
      publishedAfter.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      // 本月：从本月 1 号开始
      publishedAfter = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else {
      publishedAfter = new Date(now);
      publishedAfter.setDate(now.getDate() - 7); // 默认过去 7 天
    }

    console.log('[热门排行榜API] 时间范围:', publishedAfter.toISOString(), '至', now.toISOString());

    // 收集所有视频
    const allVideos: Map<string, any> = new Map();
    const allChannelIds: Set<string> = new Set();

    // 如果没有关键词，搜索热门视频
    if (keywordList.length === 0) {
      const trendingUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=${maxResults}&key=${apiKey}`;
      console.log('[热门排行榜API] 搜索热门视频:', trendingUrl.replace(/key=[^&]+/, 'key=***'));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const trendingResponse = await fetch(trendingUrl, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!trendingResponse.ok) {
        const errorText = await trendingResponse.text();
        console.error('[热门排行榜API] YouTube API 错误:', trendingResponse.status, errorText);
        throw new Error(`获取热门视频失败: ${trendingResponse.status} - ${errorText}`);
      }

      const trendingData = await trendingResponse.json();

      if (trendingData.items) {
        trendingData.items.forEach((item: any) => {
          allVideos.set(item.id, item);
          allChannelIds.add(item.snippet.channelId);
        });
      }
    } else {
      // 按关键词搜索
      for (const keyword of keywordList) {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(keyword)}&order=viewCount&maxResults=${Math.ceil(maxResults / keywordList.length)}&key=${apiKey}`;
        console.log('[热门排行榜API] 搜索关键词:', keyword, searchUrl.replace(/key=[^&]+/, 'key=***'));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const searchResponse = await fetch(searchUrl, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error(`[热门排行榜API] 关键词 "${keyword}" 搜索失败:`, searchResponse.status, errorText);
          continue;
        }

        const searchData = await searchResponse.json();

        if (searchData.items) {
          searchData.items.forEach((item: any) => {
            const videoId = item.id.videoId || item.id;
            allVideos.set(videoId, item);
            allChannelIds.add(item.snippet.channelId);
          });
        }
      }
    }

    console.log('[热门排行榜API] 找到视频数:', allVideos.size, '频道数:', allChannelIds.size);

    if (allVideos.size === 0) {
      return NextResponse.json({
        period,
        keywords: keywordList,
        videos: [],
        total: 0,
        timestamp: now.toISOString(),
      } as TrendingResponse);
    }

    // 批量获取视频统计和时长
    const videoIds = Array.from(allVideos.keys());
    const videosParams = new URLSearchParams({
      part: 'statistics,contentDetails,snippet',
      id: videoIds.join(','),
      key: apiKey,
    });

    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`;
    console.log('[热门排行榜API] 获取视频详情:', videosUrl.replace(/key=[^&]+/, 'key=***'));

    const controller1 = new AbortController();
    const timeoutId1 = setTimeout(() => controller1.abort(), 15000);

    const videosResponse = await fetch(videosUrl, {
      signal: controller1.signal,
    });

    clearTimeout(timeoutId1);

    if (!videosResponse.ok) {
      const errorText = await videosResponse.text();
      console.error('[热门排行榜API] YouTube API 错误:', videosResponse.status, errorText);
      throw new Error(`获取视频详情失败: ${videosResponse.status} - ${errorText}`);
    }

    const videosData = await videosResponse.json();

    // 批量获取频道信息
    const channelsParams = new URLSearchParams({
      part: 'statistics,snippet',
      id: Array.from(allChannelIds).join(','),
      key: apiKey,
    });

    const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?${channelsParams.toString()}`;
    console.log('[热门排行榜API] 获取频道详情:', channelsUrl.replace(/key=[^&]+/, 'key=***'));

    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 15000);

    const channelsResponse = await fetch(channelsUrl, {
      signal: controller2.signal,
    });

    clearTimeout(timeoutId2);

    if (!channelsResponse.ok) {
      const errorText = await channelsResponse.text();
      console.error('[热门排行榜API] YouTube API 错误:', channelsResponse.status, errorText);
      throw new Error(`获取频道详情失败: ${channelsResponse.status} - ${errorText}`);
    }

    const channelsData = await channelsResponse.json();

    // 构建数据映射
    const videosMap = new Map();
    if (videosData.items) {
      videosData.items.forEach((item: any) => {
        videosMap.set(item.id, item);
      });
    }

    const channelsMap = new Map();
    if (channelsData.items) {
      channelsData.items.forEach((item: any) => {
        channelsMap.set(item.id, item);
      });
    }

    // 组合数据并计算指标
    const trendingVideos: TrendingVideo[] = [];
    const nowTime = Date.now();

    videoIds.forEach((videoId, index) => {
      const videoDetails = videosMap.get(videoId);
      const channelDetails = channelsMap.get(videoId ? videoDetails?.snippet?.channelId : '');

      if (!videoDetails) return;

      const statistics = videoDetails.statistics || {};
      const contentDetails = videoDetails.contentDetails || {};
      const snippet = videoDetails.snippet;
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

      // 计算互动评分
      const engagementScore = Math.min(engagementRate * 10, 100);

      // 计算发布天数
      const publishedAt = new Date(snippet.publishedAt);
      const daysSincePublished = Math.floor((nowTime - publishedAt.getTime()) / (1000 * 60 * 60 * 24));

      // 计算热度评分
      const popularityScore = calculatePopularityScore(
        viewCount,
        engagementRate,
        daysSincePublished
      );

      // 计算趋势分数（综合考虑播放量增长速度、互动率、新近度）
      const trendScore = calculateTrendScore(
        viewCount,
        likeCount,
        commentCount,
        daysSincePublished,
        period
      );

      trendingVideos.push({
        id: videoId,
        title: snippet.title,
        description: snippet.description || '',
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        publishedAt: snippet.publishedAt,
        channelId: snippet.channelId,
        channelTitle: snippet.channelTitle,
        subscriberCount: parseInt(channelStats.subscriberCount || '0'),
        viewCount,
        likeCount,
        commentCount,
        duration,
        durationSeconds,
        engagementRate: Math.round(engagementRate * 100) / 100,
        engagementScore: Math.round(engagementScore),
        popularityScore: Math.round(popularityScore),
        daysSincePublished,
        trendRank: 0, // 稍后设置
        trendScore: Math.round(trendScore),
      });
    });

    // 按播放量排序（热度）
    trendingVideos.sort((a, b) => b.viewCount - a.viewCount);

    // 设置排名
    trendingVideos.forEach((video, index) => {
      video.trendRank = index + 1;
    });

    // 限制结果数量
    const finalVideos = trendingVideos.slice(0, maxResults);

    console.log('[热门排行榜API] 最终返回:', {
      totalBeforeFilter: trendingVideos.length,
      totalAfterFilter: finalVideos.length,
      hasKeywords: keywordList.length > 0,
      period,
    });

    console.log('[热门排行榜API] 返回结果数:', finalVideos.length);

    return NextResponse.json({
      period,
      keywords: keywordList,
      videos: finalVideos,
      total: finalVideos.length,
      timestamp: now.toISOString(),
    } as TrendingResponse);

  } catch (error) {
    console.error('[热门排行榜API] 错误:', error);

    let errorMessage = '获取热门排行榜失败';
    if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes('timeout')) {
        errorMessage = '请求超时，请稍后重试';
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * 解析 ISO 8601 时长格式为秒数
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
 */
function calculatePopularityScore(
  viewCount: number,
  engagementRate: number,
  daysSincePublished: number
): number {
  let viewScore = 0;
  if (viewCount > 0) {
    const logViews = Math.log10(viewCount);
    viewScore = Math.min((logViews - 3) * 20, 80);
  }

  const engagementScore = Math.min(engagementRate * 10, 100);

  let timeScore = 100;
  if (daysSincePublished > 0) {
    if (daysSincePublished <= 30) {
      timeScore = 100 - (daysSincePublished / 30) * 40;
    } else if (daysSincePublished <= 90) {
      timeScore = 60 - ((daysSincePublished - 30) / 60) * 20;
    } else {
      timeScore = 40 - Math.min((daysSincePublished - 90) / 365 * 20, 20);
    }
  }

  return (viewScore * 0.4) + (engagementScore * 0.3) + (timeScore * 0.3);
}

/**
 * 计算趋势分数（专门用于排行榜）
 */
function calculateTrendScore(
  viewCount: number,
  likeCount: number,
  commentCount: number,
  daysSincePublished: number,
  period: string
): number {
  // 播放量分数（对数缩放）
  let viewScore = Math.log10(Math.max(viewCount, 1)) * 20;

  // 互动分数（点赞和评论）
  const engagementScore = (likeCount + commentCount) / Math.max(viewCount, 1) * 1000;

  // 新近度分数（越新分数越高）
  let recencyScore = 0;
  if (period === 'today') {
    recencyScore = daysSincePublished === 0 ? 50 : Math.max(0, 50 - daysSincePublished * 10);
  } else if (period === 'week') {
    recencyScore = daysSincePublished <= 7 ? 50 : Math.max(0, 50 - (daysSincePublished - 7) * 5);
  } else {
    recencyScore = daysSincePublished <= 30 ? 50 : Math.max(0, 50 - (daysSincePublished - 30) * 2);
  }

  // 时长加分（适中长度的视频通常质量更高）
  const durationBonus = 0; // 可以后续添加

  return viewScore + engagementScore + recencyScore + durationBonus;
}
