/**
 * YouTube 发现功能相关类型定义
 */

export interface YouTubeSearchVideo {
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
