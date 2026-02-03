export interface TrendingVideo {
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
  trendRank: number;
  trendScore: number;
}

export interface TrendingResponse {
  period: 'today' | 'week' | 'month';
  keywords: string[];
  videos: TrendingVideo[];
  total: number;
  timestamp: string;
}
