/**
 * 谈判服务
 */

import { dbInstance as db } from '@/lib/db';
import { negotiations, negotiationProposals, negotiationHistory } from '@/storage/database/shared/schema';
import { logger } from '@/core/logger';
import { generateId } from '@/shared/utils/string';
import { Negotiation, NegotiationProposal } from './types';
import { desc, asc, and, eq, sql } from 'drizzle-orm';

export class NegotiationsService {
  private static instance: NegotiationsService;

  private constructor() {}

  static getInstance(): NegotiationsService {
    if (!NegotiationsService.instance) {
      NegotiationsService.instance = new NegotiationsService();
    }
    return NegotiationsService.instance;
  }

  /**
   * 创建谈判
   */
  async create(data: Omit<Negotiation, 'id' | 'createdAt'>): Promise<Negotiation> {
    const now = new Date();
    
    // 创建谈判
    const [negotiation] = await db
      .insert(negotiations)
      .values({
        id: generateId(),
        ...data,
        createdAt: now,
      })
      .returning();

    // 记录历史
    await this.recordHistory(negotiation.id, 'created', data.proposedBy, data.userId, {
      terms: data.terms,
    });

    // 创建初始提案
    await this.createProposal(negotiation.id, data.proposedBy, data.terms, data.notes);

    logger.info('Negotiation created', { id: negotiation.id, influencerId: data.influencerId, type: data.type });

    return negotiation as Negotiation;
  }

  /**
   * 创建提案
   */
  private async createProposal(
    negotiationId: string,
    proposedBy: 'user' | 'influencer',
    terms: Negotiation['terms'],
    notes?: string
  ): Promise<NegotiationProposal> {
    // 获取最新版本号
    const proposals = await db
      .select({ version: negotiationProposals.version })
      .from(negotiationProposals)
      .where(eq(negotiationProposals.negotiationId, negotiationId))
      .orderBy(desc(negotiationProposals.version))
      .limit(1);

    const version = (proposals[0]?.version || 0) + 1;

    const [proposal] = await db
      .insert(negotiationProposals)
      .values({
        id: generateId(),
        negotiationId,
        version,
        proposedBy,
        terms,
        notes,
        status: 'pending',
        createdAt: new Date(),
      })
      .returning();

    return proposal as NegotiationProposal;
  }

  /**
   * 提出反提案
   */
  async counterProposal(
    id: string,
    actor: 'user' | 'influencer',
    actorId: string,
    terms: Negotiation['terms'],
    notes?: string
  ): Promise<Negotiation> {
    const negotiation = await this.getById(id);
    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    const now = new Date();

    // 更新谈判状态
    const [updated] = await db
      .update(negotiations)
      .set({
        status: 'countered',
        terms,
        respondedBy: actor,
        respondedAt: now,
        updatedAt: now,
      })
      .where(eq(negotiations.id, id))
      .returning();

    // 创建新提案
    await this.createProposal(id, actor, terms, notes);

    // 记录历史
    await this.recordHistory(id, 'countered', actor, actorId, { terms, notes });

    logger.info('Counter proposal submitted', { id, actor });

    return updated as Negotiation;
  }

  /**
   * 接受谈判
   */
  async accept(id: string, actor: 'user' | 'influencer', actorId: string): Promise<Negotiation> {
    const negotiation = await this.getById(id);
    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    const now = new Date();

    // 更新谈判状态
    const [updated] = await db
      .update(negotiations)
      .set({
        status: 'accepted',
        respondedBy: actor,
        respondedAt: now,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(negotiations.id, id))
      .returning();

    // 更新提案状态
    await db
      .update(negotiationProposals)
      .set({ status: 'accepted', respondedAt: now })
      .where(
        and(
          eq(negotiationProposals.negotiationId, id),
          eq(negotiationProposals.status, 'pending')
        )
      );

    // 记录历史
    await this.recordHistory(id, 'accepted', actor, actorId, {});

    logger.info('Negotiation accepted', { id, actor });

    return updated as Negotiation;
  }

  /**
   * 拒绝谈判
   */
  async reject(id: string, actor: 'user' | 'influencer', actorId: string, reason?: string): Promise<Negotiation> {
    const negotiation = await this.getById(id);
    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    const now = new Date();

    // 更新谈判状态
    const [updated] = await db
      .update(negotiations)
      .set({
        status: 'rejected',
        respondedBy: actor,
        respondedAt: now,
        completedAt: now,
        notes: reason,
        updatedAt: now,
      })
      .where(eq(negotiations.id, id))
      .returning();

    // 更新提案状态
    await db
      .update(negotiationProposals)
      .set({ status: 'rejected', respondedAt: now })
      .where(
        and(
          eq(negotiationProposals.negotiationId, id),
          eq(negotiationProposals.status, 'pending')
        )
      );

    // 记录历史
    await this.recordHistory(id, 'rejected', actor, actorId, { reason });

    logger.info('Negotiation rejected', { id, actor, reason });

    return updated as Negotiation;
  }

  /**
   * 取消谈判
   */
  async cancel(id: string, actor: 'user' | 'influencer', actorId: string, reason?: string): Promise<Negotiation> {
    const negotiation = await this.getById(id);
    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    const now = new Date();

    const [updated] = await db
      .update(negotiations)
      .set({
        status: 'cancelled',
        completedAt: now,
        notes: reason,
        updatedAt: now,
      })
      .where(eq(negotiations.id, id))
      .returning();

    // 记录历史
    await this.recordHistory(id, 'cancelled', actor, actorId, { reason });

    logger.info('Negotiation cancelled', { id, actor, reason });

    return updated as Negotiation;
  }

  /**
   * 获取谈判列表
   */
  async list(
    userId: string,
    filters: {
      influencerId?: string;
      campaignId?: string;
      status?: Negotiation['status'];
      type?: Negotiation['type'];
    } = {},
    pagination: { page: number; pageSize: number } = { page: 1, pageSize: 20 }
  ): Promise<{
    data: Negotiation[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, pageSize } = pagination;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [sql`${negotiations.userId} = ${userId}`];

    if (filters.influencerId) {
      conditions.push(sql`${negotiations.influencerId} = ${filters.influencerId}`);
    }

    if (filters.campaignId) {
      conditions.push(sql`${negotiations.campaignId} = ${filters.campaignId}`);
    }

    if (filters.status) {
      conditions.push(sql`${negotiations.status} = ${filters.status}`);
    }

    if (filters.type) {
      conditions.push(sql`${negotiations.type} = ${filters.type}`);
    }

    // 查询总数
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(negotiations)
      .where(and(...conditions));

    const total = Number(count);

    // 查询数据
    const results = await db
      .select()
      .from(negotiations)
      .where(and(...conditions))
      .orderBy(desc(negotiations.createdAt))
      .limit(pageSize)
      .offset(offset);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: results as Negotiation[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  /**
   * 获取谈判详情
   */
  async getById(id: string): Promise<Negotiation | null> {
    const [result] = await db
      .select()
      .from(negotiations)
      .where(eq(negotiations.id, id));

    return result as Negotiation || null;
  }

  /**
   * 获取谈判提案列表
   */
  async getProposals(negotiationId: string): Promise<NegotiationProposal[]> {
    const results = await db
      .select()
      .from(negotiationProposals)
      .where(eq(negotiationProposals.negotiationId, negotiationId))
      .orderBy(desc(negotiationProposals.version));

    return results as NegotiationProposal[];
  }

  /**
   * 获取谈判历史记录
   */
  async getHistory(negotiationId: string): Promise<any[]> {
    const results = await db
      .select()
      .from(negotiationHistory)
      .where(eq(negotiationHistory.negotiationId, negotiationId))
      .orderBy(asc(negotiationHistory.createdAt));

    return results;
  }

  /**
   * 记录谈判历史
   */
  private async recordHistory(
    negotiationId: string,
    action: string,
    actor: 'user' | 'influencer' | 'system',
    actorId: string,
    details: Record<string, any>
  ): Promise<void> {
    await db.insert(negotiationHistory).values({
      id: generateId(),
      negotiationId,
      action,
      actor,
      actorId,
      details,
      createdAt: new Date(),
    });
  }

  /**
   * 获取谈判统计信息
   */
  async getStats(userId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    active: number;
    completed: number;
    successRate: number;
  }> {
    const allNegotiations = await db
      .select()
      .from(negotiations)
      .where(eq(negotiations.userId, userId));

    const stats = {
      total: allNegotiations.length,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      active: 0,
      completed: 0,
      successRate: 0,
    };

    for (const n of allNegotiations) {
      // 按状态统计
      const status = n.status;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // 按类型统计
      const type = n.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // 活跃和完成统计
      if (['draft', 'proposed', 'countered'].includes(status)) {
        stats.active++;
      } else if (['accepted', 'rejected', 'cancelled', 'expired'].includes(status)) {
        stats.completed++;
      }
    }

    // 计算成功率
    const accepted = stats.byStatus['accepted'] || 0;
    const totalCompleted = stats.completed;
    stats.successRate = totalCompleted > 0 ? (accepted / totalCompleted) * 100 : 0;

    return stats;
  }

  /**
   * 检查并更新过期谈判
   */
  async checkExpiredNegotiations(): Promise<number> {
    const now = new Date();

    const expired = await db
      .update(negotiations)
      .set({
        status: 'expired',
        completedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(negotiations.status, 'proposed'),
          sql`${negotiations.expiresAt} < ${now}`
        )
      )
      .returning();

    logger.info('Expired negotiations updated', { count: expired.length });

    return expired.length;
  }
}

// 导出单例实例
export const negotiationsService = NegotiationsService.getInstance();
