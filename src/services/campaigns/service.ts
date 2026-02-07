/**
 * 营销活动服务
 */

import { db } from '@/core/database';
import { campaigns, campaignParticipations } from '@/core/database/schema';
import { logger } from '@/core/logger';
import { cache, youtubeKeys } from '@/core/cache';
import { generateId } from '@/shared/utils/string';
import { 
  Campaign, 
  CampaignParticipation,
  CampaignSearchParams 
} from './types';
import { desc, asc, and, gte, lte, sql, inArray, or } from 'drizzle-orm';

export class CampaignsService {
  private static instance: CampaignsService;

  private constructor() {}

  static getInstance(): CampaignsService {
    if (!CampaignsService.instance) {
      CampaignsService.instance = new CampaignsService();
    }
    return CampaignsService.instance;
  }

  /**
   * 创建营销活动
   */
  async create(data: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign> {
    const now = new Date();
    const [campaign] = await db
      .insert(campaigns)
      .values({
        id: generateId(),
        ...data,
        createdAt: now,
      })
      .returning();

    logger.info('Campaign created', { id: campaign.id, userId: data.userId, name: data.name });

    return campaign as Campaign;
  }

  /**
   * 获取营销活动列表
   */
  async list(params: CampaignSearchParams): Promise<{
    data: Campaign[];
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

    logger.info('Listing campaigns', { params });

    // 构建查询条件
    const conditions = [];

    if (params.userId) {
      conditions.push(sql`${campaigns.userId} = ${params.userId}`);
    }

    if (params.status) {
      conditions.push(sql`${campaigns.status} = ${params.status}`);
    }

    if (params.type) {
      conditions.push(sql`${campaigns.type} = ${params.type}`);
    }

    if (params.minBudget) {
      conditions.push(gte(campaigns.budget, params.minBudget));
    }

    if (params.maxBudget) {
      conditions.push(lte(campaigns.budget, params.maxBudget));
    }

    if (params.startDateFrom) {
      conditions.push(gte(campaigns.startDate, params.startDateFrom));
    }

    if (params.startDateTo) {
      conditions.push(lte(campaigns.startDate, params.startDateTo));
    }

    if (params.endDateFrom) {
      conditions.push(gte(campaigns.endDate, params.endDateFrom));
    }

    if (params.endDateTo) {
      conditions.push(lte(campaigns.endDate, params.endDateTo));
    }

    if (params.tags && params.tags.length > 0) {
      conditions.push(
        sql`${campaigns.tags} && ${params.tags}`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 排序
    let orderBy;
    const sortField = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    switch (sortField) {
      case 'startDate':
        orderBy = sortOrder === 'desc' ? desc(campaigns.startDate) : asc(campaigns.startDate);
        break;
      case 'budget':
        orderBy = sortOrder === 'desc' ? desc(campaigns.budget) : asc(campaigns.budget);
        break;
      case 'name':
        orderBy = sortOrder === 'desc' ? desc(campaigns.name) : asc(campaigns.name);
        break;
      case 'createdAt':
      default:
        orderBy = sortOrder === 'desc' ? desc(campaigns.createdAt) : asc(campaigns.createdAt);
        break;
    }

    // 查询总数
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(campaigns)
      .where(whereClause);

    const total = Number(count);

    // 查询数据
    const results = await db
      .select()
      .from(campaigns)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    const totalPages = Math.ceil(total / pageSize);

    logger.info('Campaigns listed', { total, page, pageSize });

    return {
      data: results as Campaign[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  /**
   * 获取营销活动详情
   */
  async getById(id: string): Promise<Campaign | null> {
    const [result] = await db
      .select()
      .from(campaigns)
      .where(sql`${campaigns.id} = ${id}`);

    return result as Campaign || null;
  }

  /**
   * 更新营销活动
   */
  async update(id: string, data: Partial<Campaign>): Promise<Campaign | null> {
    const [updated] = await db
      .update(campaigns)
      .set({ ...data, updatedAt: new Date() })
      .where(sql`${campaigns.id} = ${id}`)
      .returning();

    if (updated) {
      logger.info('Campaign updated', { id });
      return updated as Campaign;
    }

    return null;
  }

  /**
   * 删除营销活动
   */
  async delete(id: string): Promise<boolean> {
    const [deleted] = await db
      .delete(campaigns)
      .where(sql`${campaigns.id} = ${id}`)
      .returning();

    if (deleted) {
      logger.info('Campaign deleted', { id });
      return true;
    }

    return false;
  }

  /**
   * 邀请达人参与活动
   */
  async inviteInfluencer(
    campaignId: string,
    influencerId: string,
    userId: string,
    compensation?: { amount: number; currency: string }
  ): Promise<CampaignParticipation> {
    const now = new Date();
    const [participation] = await db
      .insert(campaignParticipations)
      .values({
        id: generateId(),
        campaignId,
        influencerId,
        userId,
        status: 'invited',
        invitedAt: now,
        compensation,
        createdAt: now,
      })
      .returning();

    logger.info('Influencer invited to campaign', { campaignId, influencerId });

    return participation as CampaignParticipation;
  }

  /**
   * 接受活动邀请
   */
  async acceptInvitation(id: string): Promise<CampaignParticipation | null> {
    const now = new Date();
    const [updated] = await db
      .update(campaignParticipations)
      .set({
        status: 'accepted',
        acceptedAt: now,
        updatedAt: now,
      })
      .where(sql`${campaignParticipations.id} = ${id}`)
      .returning();

    if (updated) {
      logger.info('Campaign invitation accepted', { id });
      return updated as CampaignParticipation;
    }

    return null;
  }

  /**
   * 拒绝活动邀请
   */
  async declineInvitation(id: string, reason?: string): Promise<CampaignParticipation | null> {
    const now = new Date();
    const [updated] = await db
      .update(campaignParticipations)
      .set({
        status: 'declined',
        declinedAt: now,
        notes: reason,
        updatedAt: now,
      })
      .where(sql`${campaignParticipations.id} = ${id}`)
      .returning();

    if (updated) {
      logger.info('Campaign invitation declined', { id, reason });
      return updated as CampaignParticipation;
    }

    return null;
  }

  /**
   * 开始活动参与
   */
  async startParticipation(id: string): Promise<CampaignParticipation | null> {
    const now = new Date();
    const [updated] = await db
      .update(campaignParticipations)
      .set({
        status: 'in_progress',
        startedAt: now,
        updatedAt: now,
      })
      .where(sql`${campaignParticipations.id} = ${id}`)
      .returning();

    if (updated) {
      logger.info('Campaign participation started', { id });
      return updated as CampaignParticipation;
    }

    return null;
  }

  /**
   * 完成活动参与
   */
  async completeParticipation(
    id: string,
    metrics?: CampaignParticipation['metrics']
  ): Promise<CampaignParticipation | null> {
    const now = new Date();
    const [updated] = await db
      .update(campaignParticipations)
      .set({
        status: 'completed',
        completedAt: now,
        metrics,
        updatedAt: now,
      })
      .where(sql`${campaignParticipations.id} = ${id}`)
      .returning();

    if (updated) {
      logger.info('Campaign participation completed', { id });
      return updated as CampaignParticipation;
    }

    return null;
  }

  /**
   * 获取活动的参与列表
   */
  async getParticipations(
    campaignId: string,
    status?: CampaignParticipation['status']
  ): Promise<CampaignParticipation[]> {
    const conditions = [sql`${campaignParticipations.campaignId} = ${campaignId}`];

    if (status) {
      conditions.push(sql`${campaignParticipations.status} = ${status}`);
    }

    const results = await db
      .select()
      .from(campaignParticipations)
      .where(and(...conditions))
      .orderBy(desc(campaignParticipations.createdAt));

    return results as CampaignParticipation[];
  }

  /**
   * 获取活动统计数据
   */
  async getCampaignStats(campaignId: string): Promise<{
    totalInvitations: number;
    acceptedInvitations: number;
    declinedInvitations: number;
    inProgress: number;
    completed: number;
    totalBudget: number;
    totalViews: number;
    totalEngagement: number;
    totalConversions: number;
    totalRevenue: number;
  }> {
    const participations = await this.getParticipations(campaignId);

    const stats = {
      totalInvitations: 0,
      acceptedInvitations: 0,
      declinedInvitations: 0,
      inProgress: 0,
      completed: 0,
      totalBudget: 0,
      totalViews: 0,
      totalEngagement: 0,
      totalConversions: 0,
      totalRevenue: 0,
    };

    for (const p of participations) {
      stats.totalInvitations++;
      
      if (p.status === 'accepted') stats.acceptedInvitations++;
      else if (p.status === 'declined') stats.declinedInvitations++;
      else if (p.status === 'in_progress') stats.inProgress++;
      else if (p.status === 'completed') {
        stats.completed++;
        stats.totalBudget += p.compensation?.amount || 0;
        stats.totalViews += p.metrics?.views || 0;
        stats.totalEngagement += (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0);
        stats.totalConversions += p.metrics?.conversions || 0;
        stats.totalRevenue += p.metrics?.revenue || 0;
      }
    }

    return stats;
  }

  /**
   * 批量邀请达人
   */
  async batchInviteInfluencers(
    campaignId: string,
    influencerIds: string[],
    userId: string,
    compensation?: { amount: number; currency: string }
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const influencerId of influencerIds) {
      try {
        await this.inviteInfluencer(campaignId, influencerId, userId, compensation);
        success++;
      } catch (error) {
        logger.error('Failed to invite influencer', error as Error, { campaignId, influencerId });
        failed++;
      }
    }

    logger.info('Batch invitations completed', { campaignId, success, failed, total: influencerIds.length });

    return { success, failed };
  }
}

// 导出单例实例
export const campaignsService = CampaignsService.getInstance();
