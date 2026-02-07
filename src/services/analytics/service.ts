/**
 * 分析服务
 */

import { dbInstance as db } from '@/lib/db';
import { influencers, youtubeVideos, campaignParticipations, campaigns } from '@/storage/database/shared/schema';
import { logger } from '@/core/logger';
import { cache, statsKeys } from '@/core/cache';
import { sum, avg, and, sql, gte, lte, desc } from 'drizzle-orm';

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * 获取系统概览统计
   */
  async getSystemOverview(): Promise<{
    totalInfluencers: number;
    totalVideos: number;
    totalCampaigns: number;
    totalParticipations: number;
    onlineUsers: number;
    systemHealth: 'healthy' | 'degraded' | 'down';
  }> {
    const cacheKey = statsKeys.systemOverview();
    
    // 尝试从缓存获取
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 并行获取各种统计数据
    const [influencersCount, videosCount, campaignsCount, participationsCount, onlineUsers] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(influencers).then(rows => Number(rows[0].count)),
      db.select({ count: sql<number>`count(*)` }).from(youtubeVideos).then(rows => Number(rows[0].count)),
      db.select({ count: sql<number>`count(*)` }).from(campaigns).then(rows => Number(rows[0].count)),
      db.select({ count: sql<number>`count(*)` }).from(campaignParticipations).then(rows => Number(rows[0].count)),
      this.getOnlineUsersCount(),
    ]);

    const result = {
      totalInfluencers: influencersCount,
      totalVideos: videosCount,
      totalCampaigns: campaignsCount,
      totalParticipations: participationsCount,
      onlineUsers,
      systemHealth: 'healthy' as const,
    };

    // 缓存结果（1分钟）
    cache.set(cacheKey, result, { ttl: 60 });

    logger.info('System overview stats', result);

    return result;
  }

  /**
   * 获取达人统计数据
   */
  async getInfluencerStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byScoreTier: Record<string, number>;
    byCategory: Record<string, number>;
    topBySubscribers: Array<{ id: string; channelTitle: string; subscriberCount: number }>;
    topByEngagement: Array<{ id: string; channelTitle: string; engagementRate: number }>;
  }> {
    const allInfluencers = await db.select().from(influencers);

    const stats = {
      total: allInfluencers.length,
      byStatus: {} as Record<string, number>,
      byScoreTier: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      topBySubscribers: [] as Array<{ id: string; channelTitle: string; subscriberCount: number }>,
      topByEngagement: [] as Array<{ id: string; channelTitle: string; engagementRate: number }>,
    };

    for (const inf of allInfluencers) {
      // 按状态统计
      const status = inf.collaborationStatus || 'available';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // 按评分等级统计
      const tier = inf.scoreTier || 'D';
      stats.byScoreTier[tier] = (stats.byScoreTier[tier] || 0) + 1;

      // 按分类统计
      if (inf.category) {
        stats.byCategory[inf.category] = (stats.byCategory[inf.category] || 0) + 1;
      }
    }

    // 获取订阅量 Top 10
    stats.topBySubscribers = allInfluencers
      .map(inf => ({
        id: inf.id,
        channelTitle: inf.channelTitle,
        subscriberCount: inf.subscriberCount,
      }))
      .sort((a, b) => b.subscriberCount - a.subscriberCount)
      .slice(0, 10);

    // 获取互动率 Top 10
    stats.topByEngagement = allInfluencers
      .filter(inf => inf.engagementRate !== null && inf.engagementRate !== undefined)
      .map(inf => ({
        id: inf.id,
        channelTitle: inf.channelTitle,
        engagementRate: inf.engagementRate!,
      }))
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 10);

    return stats;
  }

  /**
   * 获取活动统计数据
   */
  async getCampaignStats(userId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    activeCampaigns: number;
    totalBudget: number;
    averageBudget: number;
  }> {
    let query = db.select().from(campaigns);

    if (userId) {
      query = query.where(sql`${campaigns.userId} = ${userId}`);
    }

    const allCampaigns = await query;

    const stats = {
      total: allCampaigns.length,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      activeCampaigns: 0,
      totalBudget: 0,
      averageBudget: 0,
    };

    let totalBudget = 0;

    for (const campaign of allCampaigns) {
      // 按状态统计
      const status = campaign.status;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // 按类型统计
      const type = campaign.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // 活跃活动
      if (status === 'active') {
        stats.activeCampaigns++;
      }

      // 预算统计
      if (campaign.budget) {
        totalBudget += Number(campaign.budget);
      }
    }

    stats.totalBudget = totalBudget;
    stats.averageBudget = allCampaigns.length > 0 ? totalBudget / allCampaigns.length : 0;

    return stats;
  }

  /**
   * 获取参与统计数据
   */
  async getParticipationStats(campaignId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    completionRate: number;
    totalViews: number;
    totalRevenue: number;
    averageViews: number;
  }> {
    let query = db.select().from(campaignParticipations);

    if (campaignId) {
      query = query.where(sql`${campaignParticipations.campaignId} = ${campaignId}`);
    }

    const allParticipations = await query;

    const stats = {
      total: allParticipations.length,
      byStatus: {} as Record<string, number>,
      completionRate: 0,
      totalViews: 0,
      totalRevenue: 0,
      averageViews: 0,
    };

    for (const p of allParticipations) {
      // 按状态统计
      const status = p.status;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // 指标统计
      if (p.metrics) {
        stats.totalViews += p.metrics.views || 0;
        stats.totalRevenue += p.metrics.revenue || 0;
      }
    }

    // 计算完成率
    const completed = stats.byStatus['completed'] || 0;
    stats.completionRate = stats.total > 0 ? (completed / stats.total) * 100 : 0;

    // 计算平均观看数
    const completedParticipations = allParticipations.filter(p => p.status === 'completed' && p.metrics?.views);
    stats.averageViews = completedParticipations.length > 0
      ? completedParticipations.reduce((sum, p) => sum + (p.metrics?.views || 0), 0) / completedParticipations.length
      : 0;

    return stats;
  }

  /**
   * 获取在线用户数量
   */
  private async getOnlineUsersCount(): Promise<number> {
    // 这里使用内存存储的在线用户数
    // 实际实现应该使用 Redis 或数据库
    const cacheKey = statsKeys.onlineUsers();
    const cached = cache.get<number>(cacheKey);
    
    if (cached !== null) {
      return cached;
    }

    // 模拟在线用户数
    const count = Math.floor(Math.random() * 50) + 10;
    cache.set(cacheKey, count, { ttl: 30 });
    
    return count;
  }

  /**
   * 获取每日活跃用户
   */
  async getDailyActiveUsers(date?: Date): Promise<{
    date: string;
    count: number;
  }> {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    const cacheKey = statsKeys.dailyActive(dateStr);
    
    // 尝试从缓存获取
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 模拟数据
    const result = {
      date: dateStr,
      count: Math.floor(Math.random() * 100) + 20,
    };

    // 缓存结果（1小时）
    cache.set(cacheKey, result, { ttl: 3600 });

    return result;
  }

  /**
   * 获取视频数量统计
   */
  async getVideoCountStats(channelId?: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    averageViews: number;
    topVideos: Array<{
      id: string;
      title: string;
      viewCount: number;
      publishedAt: Date;
    }>;
  }> {
    let query = db.select().from(youtubeVideos);

    if (channelId) {
      query = query.where(sql`${youtubeVideos.channelId} = ${channelId}`);
    }

    const allVideos = await query;

    const stats = {
      total: allVideos.length,
      byCategory: {} as Record<string, number>,
      averageViews: 0,
      topVideos: [] as Array<{
        id: string;
        title: string;
        viewCount: number;
        publishedAt: Date;
      }>,
    };

    let totalViews = 0;

    for (const video of allVideos) {
      // 按分类统计
      if (video.categoryId) {
        stats.byCategory[video.categoryId] = (stats.byCategory[video.categoryId] || 0) + 1;
      }

      totalViews += video.viewCount;
    }

    stats.averageViews = allVideos.length > 0 ? totalViews / allVideos.length : 0;

    // 获取 Top 10 视频
    stats.topVideos = allVideos
      .map(v => ({
        id: v.id,
        title: v.title,
        viewCount: v.viewCount,
        publishedAt: v.publishedAt,
      }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10);

    return stats;
  }

  /**
   * 获取趋势数据
   */
  async getTrendData(
    metric: 'influencers' | 'videos' | 'campaigns' | 'views',
    period: '7d' | '30d' | '90d' = '30d'
  ): Promise<Array<{
    date: string;
    value: number;
  }>> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const result: Array<{ date: string; value: number }> = [];

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // 模拟趋势数据
      const baseValue = metric === 'influencers' ? 100 :
                      metric === 'videos' ? 500 :
                      metric === 'campaigns' ? 20 : 10000;
      const randomValue = baseValue + Math.floor(Math.random() * baseValue * 0.5);

      result.push({
        date: dateStr,
        value: randomValue,
      });
    }

    return result;
  }

  /**
   * 清除统计缓存
   */
  clearStatsCache(): void {
    cache.delete(statsKeys.systemOverview());
    cache.delete(statsKeys.onlineUsers());
    logger.info('Stats cache cleared');
  }
}

// 导出单例实例
export const analyticsService = AnalyticsService.getInstance();
