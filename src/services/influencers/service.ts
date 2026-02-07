/**
 * 达人社核心服务
 */

import { db } from '@/core/database';
import { influencers } from '@/core/database/schema';
import { cache, youtubeKeys } from '@/core/cache';
import { logger } from '@/core/logger';
import { config } from '@/core/config';
import { generateId } from '@/shared/utils/string';
import { 
  InfluencerProfile, 
  InfluencerSearchParams, 
  InfluencerAnalytics,
  PaginationParams
} from './types';
import { desc, asc, and, gte, lte, sql, inArray, or } from 'drizzle-orm';

export class InfluencersService {
  private static instance: InfluencersService;

  private constructor() {}

  static getInstance(): InfluencersService {
    if (!InfluencersService.instance) {
      InfluencersService.instance = new InfluencersService();
    }
    return InfluencersService.instance;
  }

  /**
   * 搜索达人
   */
  async search(params: InfluencerSearchParams): Promise<{
    data: InfluencerProfile[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const offset = (page - 1) * pageSize;

    logger.info('Searching influencers', { params });

    // 构建查询条件
    const conditions = [];

    if (params.category) {
      conditions.push(sql`${influencers.category} = ${params.category}`);
    }

    if (params.minSubscribers) {
      conditions.push(gte(influencers.subscriberCount, params.minSubscribers));
    }

    if (params.maxSubscribers) {
      conditions.push(lte(influencers.subscriberCount, params.maxSubscribers));
    }

    if (params.minViews) {
      conditions.push(gte(influencers.viewCount, params.minViews));
    }

    if (params.maxViews) {
      conditions.push(lte(influencers.viewCount, params.maxViews));
    }

    if (params.minEngagementRate) {
      conditions.push(gte(influencers.engagementRate, params.minEngagementRate));
    }

    if (params.maxEngagementRate) {
      conditions.push(lte(influencers.engagementRate, params.maxEngagementRate));
    }

    if (params.collaborationStatus) {
      conditions.push(
        sql`${influencers.collaborationStatus} = ${params.collaborationStatus}`
      );
    }

    if (params.niche && params.niche.length > 0) {
      conditions.push(
        sql`${influencers.niche} && ${params.niche}`
      );
    }

    if (params.query) {
      const searchTerm = `%${params.query}%`;
      conditions.push(
        or(
          sql`${influencers.channelTitle} ILIKE ${searchTerm}`,
          sql`${influencers.description} ILIKE ${searchTerm}`,
          sql`${influencers.customUrl} ILIKE ${searchTerm}`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 排序
    let orderBy;
    const sortField = params.sortBy || 'totalScore';
    const sortOrder = params.sortOrder || 'desc';

    switch (sortField) {
      case 'subscriberCount':
        orderBy = sortOrder === 'desc' ? desc(influencers.subscriberCount) : asc(influencers.subscriberCount);
        break;
      case 'viewCount':
        orderBy = sortOrder === 'desc' ? desc(influencers.viewCount) : asc(influencers.viewCount);
        break;
      case 'engagementRate':
        orderBy = sortOrder === 'desc' ? desc(influencers.engagementRate) : asc(influencers.engagementRate);
        break;
      case 'totalScore':
      default:
        orderBy = sortOrder === 'desc' ? desc(influencers.totalScore) : asc(influencers.totalScore);
        break;
    }

    // 查询总数
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(influencers)
      .where(whereClause);

    const total = Number(count);

    // 查询数据
    const results = await db
      .select()
      .from(influencers)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    const totalPages = Math.ceil(total / pageSize);

    logger.info('Search completed', { total, page, pageSize });

    return {
      data: results as InfluencerProfile[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  /**
   * 获取达人详情
   */
  async getById(id: string): Promise<InfluencerProfile | null> {
    const cacheKey = youtubeKeys.channel(id);

    // 尝试从缓存获取
    const cached = cache.get<InfluencerProfile>(cacheKey);
    if (cached) {
      return cached;
    }

    // 从数据库获取
    const [result] = await db
      .select()
      .from(influencers)
      .where(sql`${influencers.id} = ${id}`);

    if (result) {
      const profile = result as InfluencerProfile;
      // 缓存结果（4小时）
      cache.set(cacheKey, profile, { ttl: 14400 });
      return profile;
    }

    return null;
  }

  /**
   * 根据 YouTube 频道 ID 获取达人
   */
  async getByChannelId(channelId: string): Promise<InfluencerProfile | null> {
    const [result] = await db
      .select()
      .from(influencers)
      .where(sql`${influencers.channelId} = ${channelId}`);

    return result as InfluencerProfile || null;
  }

  /**
   * 创建或更新达人档案
   */
  async upsert(data: Partial<InfluencerProfile> & { channelId: string }): Promise<InfluencerProfile> {
    const existing = await this.getByChannelId(data.channelId);

    const now = new Date();

    if (existing) {
      // 更新
      const [updated] = await db
        .update(influencers)
        .set({
          ...data,
          updatedAt: now,
          lastSyncedAt: now,
        })
        .where(sql`${influencers.id} = ${existing.id}`)
        .returning();

      // 清除缓存
      const cacheKey = youtubeKeys.channel(existing.id);
      cache.delete(cacheKey);

      logger.info('Influencer updated', { id: existing.id, channelId: data.channelId });

      return updated as InfluencerProfile;
    } else {
      // 创建
      const [created] = await db
        .insert(influencers)
        .values({
          id: generateId(),
          ...data,
          createdAt: now,
          lastSyncedAt: now,
        })
        .returning();

      logger.info('Influencer created', { id: created.id, channelId: data.channelId });

      return created as InfluencerProfile;
    }
  }

  /**
   * 删除达人
   */
  async delete(id: string): Promise<boolean> {
    const [deleted] = await db
      .delete(influencers)
      .where(sql`${influencers.id} = ${id}`)
      .returning();

    // 清除缓存
    cache.delete(youtubeKeys.channel(id));

    if (deleted) {
      logger.info('Influencer deleted', { id });
      return true;
    }

    return false;
  }

  /**
   * 更新达人合作状态
   */
  async updateCooperationStatus(
    id: string,
    status: 'available' | 'cooperating' | 'blacklisted'
  ): Promise<InfluencerProfile | null> {
    const [updated] = await db
      .update(influencers)
      .set({ collaborationStatus: status, updatedAt: new Date() })
      .where(sql`${influencers.id} = ${id}`)
      .returning();

    if (updated) {
      // 清除缓存
      cache.delete(youtubeKeys.channel(id));
      logger.info('Cooperation status updated', { id, status });
      return updated as InfluencerProfile;
    }

    return null;
  }

  /**
   * 计算并更新达人评分
   */
  async recalculateScore(id: string): Promise<InfluencerProfile | null> {
    const influencer = await this.getById(id);
    if (!influencer) {
      return null;
    }

    // 计算综合评分（0-100）
    const subscriberScore = Math.min(influencer.subscriberCount / 1000000 * 30, 30); // 最高30分
    const engagementScore = (influencer.engagementRate || 0) / 10 * 30; // 最高30分
    const viewScore = Math.min(influencer.viewCount / 10000000 * 20, 20); // 最高20分
    const collaborationScore = Math.min((influencer.collaborationCount || 0) * 2, 20); // 最高20分

    const totalScore = Math.round(subscriberScore + engagementScore + viewScore + collaborationScore);

    // 确定评分等级
    let scoreTier: string;
    if (totalScore >= 80) scoreTier = 'S';
    else if (totalScore >= 60) scoreTier = 'A';
    else if (totalScore >= 40) scoreTier = 'B';
    else if (totalScore >= 20) scoreTier = 'C';
    else scoreTier = 'D';

    const [updated] = await db
      .update(influencers)
      .set({
        totalScore,
        scoreTier,
        updatedAt: new Date(),
      })
      .where(sql`${influencers.id} = ${id}`)
      .returning();

    if (updated) {
      cache.delete(youtubeKeys.channel(id));
      logger.info('Score recalculated', { id, totalScore, scoreTier });
      return updated as InfluencerProfile;
    }

    return null;
  }

  /**
   * 批量同步达人数据
   */
  async batchUpsert(data: Array<Partial<InfluencerProfile> & { channelId: string }>): Promise<number> {
    let count = 0;

    for (const item of data) {
      try {
        await this.upsert(item);
        count++;
      } catch (error) {
        logger.error('Failed to upsert influencer', error as Error, { channelId: item.channelId });
      }
    }

    logger.info('Batch upsert completed', { count, total: data.length });

    return count;
  }

  /**
   * 获取达人统计信息
   */
  async getStats(): Promise<{
    total: number;
    available: number;
    cooperating: number;
    blacklisted: number;
    byScoreTier: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const allInfluencers = await db.select().from(influencers);

    const stats = {
      total: allInfluencers.length,
      available: 0,
      cooperating: 0,
      blacklisted: 0,
      byScoreTier: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };

    for (const influencer of allInfluencers) {
      // 统计合作状态
      if (influencer.collaborationStatus === 'available') stats.available++;
      else if (influencer.collaborationStatus === 'cooperating') stats.cooperating++;
      else if (influencer.collaborationStatus === 'blacklisted') stats.blacklisted++;

      // 统计评分等级
      const tier = influencer.scoreTier || 'D';
      stats.byScoreTier[tier] = (stats.byScoreTier[tier] || 0) + 1;

      // 统计分类
      if (influencer.category) {
        stats.byCategory[influencer.category] = (stats.byCategory[influencer.category] || 0) + 1;
      }
    }

    return stats;
  }
}

// 导出单例实例
export const influencersService = InfluencersService.getInstance();
