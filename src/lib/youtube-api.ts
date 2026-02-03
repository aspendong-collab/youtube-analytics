import {
  YouTubeSearchResponse,
  YouTubeVideo,
  YouTubeChannel,
  VideoMetrics,
  ChannelMetrics,
  CompetitorAnalysis,
} from "@/types/youtube";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

// 将 ISO 8601 时长转换为秒数
function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  return hours * 3600 + minutes * 60 + seconds;
}

// 格式化时长
function formatDuration(duration: string): string {
  const totalSeconds = parseDuration(duration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// 计算天数
function getDaysSince(publishedAt: string): number {
  const publishedDate = new Date(publishedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - publishedDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 计算参与度
function calculateEngagementRate(views: number, likes: number, comments: number): number {
  if (views === 0) return 0;
  return ((likes + comments) / views) * 100;
}

// 搜索视频
export async function searchVideos(
  query: string,
  maxResults: number = 50,
  order: "relevance" | "date" | "viewCount" | "rating" = "relevance"
): Promise<YouTubeSearchResponse> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API Key not configured");
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    maxResults: maxResults.toString(),
    order,
    type: "video",
    key: YOUTUBE_API_KEY,
  });

  const response = await fetch(
    `${YOUTUBE_API_BASE_URL}/search?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube API error: ${error.error.message}`);
  }

  return response.json();
}

// 获取视频详情（包括统计数据）
export async function getVideosDetails(videoIds: string[]): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API Key not configured");
  }

  const params = new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    id: videoIds.join(","),
    key: YOUTUBE_API_KEY,
  });

  const response = await fetch(
    `${YOUTUBE_API_BASE_URL}/videos?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube API error: ${error.error.message}`);
  }

  const data = await response.json();
  return data.items || [];
}

// 获取频道详情
export async function getChannelsDetails(channelIds: string[]): Promise<YouTubeChannel[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API Key not configured");
  }

  const params = new URLSearchParams({
    part: "snippet,statistics,brandingSettings",
    id: channelIds.join(","),
    key: YOUTUBE_API_KEY,
  });

  const response = await fetch(
    `${YOUTUBE_API_BASE_URL}/channels?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube API error: ${error.error.message}`);
  }

  const data = await response.json();
  return data.items || [];
}

// 竞品分析
export async function analyzeCompetitors(
  query: string,
  maxResults: number = 50
): Promise<CompetitorAnalysis> {
  // 1. 搜索相关视频
  const searchResults = await searchVideos(query, maxResults, "viewCount");

  // 2. 提取视频 ID 和频道 ID
  const videoIds = searchResults.items
    .filter(item => item.id.videoId)
    .map(item => item.id.videoId!);

  const channelIds = Array.from(
    new Set(searchResults.items.map(item => item.snippet.channelId))
  );

  // 3. 获取视频详情（统计数据）
  const videosDetails = await getVideosDetails(videoIds);

  // 4. 获取频道详情
  const channelsDetails = await getChannelsDetails(channelIds);

  // 5. 计算视频指标
  const videoMetrics: VideoMetrics[] = videosDetails.map(video => {
    const views = parseInt(video.statistics?.viewCount || "0");
    const likes = parseInt(video.statistics?.likeCount || "0");
    const comments = parseInt(video.statistics?.commentCount || "0");
    const daysSincePublish = getDaysSince(video.snippet.publishedAt);

    return {
      videoId: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      thumbnail: video.snippet.thumbnails.high.url,
      viewCount: views,
      likeCount: likes,
      commentCount: comments,
      duration: formatDuration(video.contentDetails?.duration || "PT0S"),
      engagementRate: calculateEngagementRate(views, likes, comments),
      viewsPerDay: daysSincePublish > 0 ? views / daysSincePublish : views,
    };
  });

  // 6. 计算频道指标
  const channelMetrics: ChannelMetrics[] = channelsDetails.map(channel => {
    const subscriberCount = parseInt(channel.statistics.subscriberCount);
    const totalViews = parseInt(channel.statistics.viewCount);
    const videoCount = parseInt(channel.statistics.videoCount);

    return {
      channelId: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default.url,
      subscriberCount,
      videoCount,
      totalViews,
      viewsPerVideo: videoCount > 0 ? totalViews / videoCount : 0,
      subscriberGrowthRate: 0, // 需要历史数据才能计算
    };
  });

  // 7. 计算平均值
  const averageViews =
    videoMetrics.reduce((sum, v) => sum + v.viewCount, 0) / videoMetrics.length;
  const averageEngagement =
    videoMetrics.reduce((sum, v) => sum + v.engagementRate, 0) / videoMetrics.length;

  // 8. 识别趋势（上升和下降的内容）
  const sortedByViewsPerDay = [...videoMetrics].sort((a, b) => b.viewsPerDay - a.viewsPerDay);
  const sortedByEngagement = [...videoMetrics].sort((a, b) => b.engagementRate - a.engagementRate);

  return {
    keyword: query,
    totalResults: searchResults.pageInfo.totalResults,
    topVideos: sortedByViewsPerDay.slice(0, 10),
    topChannels: channelMetrics
      .sort((a, b) => b.subscriberCount - a.subscriberCount)
      .slice(0, 10),
    averageViews: Math.round(averageViews),
    averageEngagement: parseFloat(averageEngagement.toFixed(2)),
    trends: {
      rising: sortedByViewsPerDay.slice(0, 5).map(v => v.title),
      declining: sortedByViewsPerDay.slice(-5).reverse().map(v => v.title),
    },
  };
}

// 获取频道上传的视频
export async function getChannelVideos(
  channelId: string,
  maxResults: number = 50
): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API Key not configured");
  }

  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    channelId,
    maxResults: maxResults.toString(),
    order: "date",
    key: YOUTUBE_API_KEY,
  });

  const response = await fetch(
    `${YOUTUBE_API_BASE_URL}/search?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube API error: ${error.error.message}`);
  }

  const data = await response.json();
  const videoIds = data.items
    .filter((item: any) => item.id.videoId)
    .map((item: any) => item.id.videoId);

  // 获取视频统计数据
  return getVideosDetails(videoIds);
}
