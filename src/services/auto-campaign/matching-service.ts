/**
 * 自动匹配服务
 * 根据推广项目的筛选条件自动匹配达人
 */

import { dbInstance as db } from '@/lib/db';
import { influencers, campaignAutoMatches } from '@/storage/database/shared/schema';
import { logger } from '@/core/logger';
import { cache } from '@/core/cache';
import { 
  and, 
  or, 
  gte, 
  lte, 
  sql, 
  desc, 
  inArray, 
  isNull,
  between 
} from 'drizzle-orm';
import {
  AutoMatchRequest,
  AutoMatchResult,
  MatchedInfluencer,
  InfluencerMatch,
  TargetingCriteria
} from './types';
import { generateId } from '@/shared/utils/string';

export class AutoMatchingService {
  private static instance: AutoMatchingService;

  private constructor() {}

  static getInstance(): AutoMatchingService {
    if (!AutoMatchingService.instance) {
      AutoMatchingService.instance = new AutoMatchingService();
    }
    return AutoMatchingService.instance;
  }

  /**
   * 根据筛选条件自动匹配达人
   */
  async match(request: AutoMatchRequest): Promise<AutoMatchResult> {
    const startTime = Date.now();

    logger.info('Starting auto matching', {
      campaignId: request.campaignId,
      criteria: request.criteria,
      budgetLimit: request.budgetLimit,
      priceLimit: request.priceLimit,
    });

    try {
      // 1. 构建查询条件
      const conditions = this.buildQueryConditions(request.criteria, request.priceLimit);

      // 2. 查询符合条件的达人
      // 获取所有符合条件的达人，后续会在总预算范围内筛选
      const candidates = await db
        .select()
        .from(influencers)
        .where(
          and(
            ...conditions,
            sql`${influencers.status} = 'available'`, // 只匹配可合作的达人
            sql`${influencers.isActive} = true`,
            sql`${influencers.email} IS NOT NULL`, // 必须有邮箱
          )
        )
        .orderBy(
          desc(influencers.qualityScore), // 质量优先
          desc(influencers.engagementRate), // 互动率次之
          sql`${influencers.averagePrice} ASC`, // 价格升序，优先选择性价比高的
        )
        .limit(200); // 最多获取200个候选人

      logger.info(`Found ${candidates.length} candidate influencers`, {
        campaignId: request.campaignId,
      });

      // 3. 计算匹配度评分并排序
      const scoredCandidates = candidates.map(candidate => {
        const score = this.calculateMatchScore(candidate, request.criteria);
        const reasons = this.getMatchReasons(candidate, request.criteria, score);
        return {
          influencer: candidate,
          matchScore: score,
          matchReason: reasons,
        };
      }).filter(item => item.matchScore > 50) // 过滤掉匹配度过低的
        .sort((a, b) => b.matchScore - a.matchScore); // 按匹配度降序

      logger.info(`Scored and filtered to ${scoredCandidates.length} matches`, {
        campaignId: request.campaignId,
      });

      // 4. 在总预算范围内筛选达人
      const matchedInfluencers: MatchedInfluencer[] = [];
      let totalCost = 0;

      for (const scored of scoredCandidates) {
        const estimatedPrice = this.estimatePrice(scored.influencer, request.priceLimit);

        // 检查是否超出总预算
        if (totalCost + estimatedPrice > request.budgetLimit) {
          logger.info(`Budget limit reached, stopping matching`, {
            campaignId: request.campaignId,
            totalCost,
            budgetLimit: request.budgetLimit,
            matchedCount: matchedInfluencers.length,
          });
          break;
        }

        // 保存匹配结果到数据库
        const [match] = await db
          .insert(campaignAutoMatches)
          .values({
            id: generateId(),
            campaignId: request.campaignId,
            influencerId: scored.influencer.id,
            estimatedPrice: estimatedPrice,
            matchScore: scored.matchScore,
            matchReason: JSON.stringify(scored.matchReason),
            status: 'pending',
          })
          .returning();

        matchedInfluencers.push({
          influencerId: match.influencerId,
          influencer: this.mapToMatchedInfluencer(scored.influencer),
          estimatedPrice: match.estimatedPrice,
          matchScore: scored.matchScore,
          matchReason: scored.matchReason,
        });

        totalCost += estimatedPrice;
      }

      // 5. 计算统计数据
      const totalMatched = matchedInfluencers.length;
      const estimatedTotalCost = matchedInfluencers.reduce(
        (sum, match) => sum + match.estimatedPrice,
        0
      );
      const matchDuration = Date.now() - startTime;

      logger.info('Auto matching completed', {
        campaignId: request.campaignId,
        totalMatched,
        estimatedTotalCost,
        matchDuration,
      });

      return {
        campaignId: request.campaignId,
        matchedInfluencers,
        totalMatched,
        estimatedTotalCost,
        matchDuration,
      };

    } catch (error) {
      logger.error('Auto matching failed', error as Error, {
        campaignId: request.campaignId,
      });
      throw error;
    }
  }

  /**
   * 构建查询条件
   */
  private buildQueryConditions(criteria: TargetingCriteria, priceLimit?: number) {
    const conditions: any[] = [];

    // 订阅数范围
    conditions.push(
      and(
        gte(influencers.subscriberCount, criteria.minSubscriberCount),
        lte(influencers.subscriberCount, criteria.maxSubscriberCount)
      )
    );

    // 最低互动率
    conditions.push(gte(influencers.engagementRate, criteria.minEngagementRate));

    // YouTube 标准分类筛选
    if (criteria.categories && criteria.categories.length > 0) {
      conditions.push(inArray(influencers.categoryId, criteria.categories));
    }

    // 语言筛选
    if (criteria.languages && criteria.languages.length > 0) {
      conditions.push(inArray(influencers.defaultLanguage, criteria.languages));
    }

    // 价格上限（如果设置了）
    if (priceLimit) {
      conditions.push(lte(influencers.averagePrice, priceLimit));
    } else if (criteria.maxPrice) {
      conditions.push(lte(influencers.averagePrice, criteria.maxPrice));
    }

    // 最低质量评分
    if (criteria.minQualityScore) {
      conditions.push(gte(influencers.qualityScore, criteria.minQualityScore));
    }

    // 等级筛选
    if (criteria.level && criteria.level.length > 0) {
      conditions.push(inArray(influencers.level, criteria.level));
    }

    return conditions;
  }

  /**
   * 计算匹配度评分（0-100）
   */
  private calculateMatchScore(
    influencer: InfluencerMatch,
    criteria: TargetingCriteria
  ): number {
    let score = 0;

    // 1. 订阅数得分（20分）
    const subscriberScore = this.calculateSubscriberScore(
      influencer.subscriberCount,
      criteria.minSubscriberCount,
      criteria.maxSubscriberCount
    );
    score += subscriberScore * 0.2;

    // 2. 互动率得分（25分）
    const engagementScore = this.calculateEngagementScore(
      influencer.engagementRate || 0,
      criteria.minEngagementRate
    );
    score += engagementScore * 0.25;

    // 3. 价格得分（30分）- 价格越低得分越高
    if (influencer.averagePrice && criteria.maxPrice) {
      const priceScore = this.calculatePriceScore(
        influencer.averagePrice,
        criteria.maxPrice
      );
      score += priceScore * 0.3;
    }

    // 4. 质量评分（15分）
    if (influencer.qualityScore) {
      score += (influencer.qualityScore / 100) * 15;
    }

    // 5. 合作评分（10分）
    if (influencer.cooperationScore) {
      score += (influencer.cooperationScore / 100) * 10;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * 计算订阅数得分
   */
  private calculateSubscriberScore(
    current: number,
    min: number,
    max: number
  ): number {
    if (max === min) return 50;
    return ((current - min) / (max - min)) * 100;
  }

  /**
   * 计算互动率得分
   */
  private calculateEngagementScore(current: number, min: number): number {
    if (min === 0) return 50;
    const ratio = current / min;
    return Math.min(100, ratio * 50); // 互动率达到最小要求的2倍即满分
  }

  /**
   * 计算价格得分（价格越低得分越高）
   */
  private calculatePriceScore(price: number, budget: number): number {
    if (budget <= 0) return 50;
    if (price > budget) return 0;
    const discount = 1 - (price / budget);
    return discount * 100;
  }

  /**
   * 获取匹配原因
   */
  private getMatchReasons(
    influencer: InfluencerMatch,
    criteria: TargetingCriteria,
    score: number
  ): string[] {
    const reasons: string[] = [];

    if (score >= 80) reasons.push('匹配度极高');
    else if (score >= 60) reasons.push('匹配度高');
    else reasons.push('匹配度良好');

    if (influencer.subscriberCount >= criteria.minSubscriberCount * 2) {
      reasons.push(`粉丝数超过最低要求 ${Math.floor(influencer.subscriberCount / criteria.minSubscriberCount * 100 - 100)}%`);
    }

    if (influencer.engagementRate && influencer.engagementRate >= criteria.minEngagementRate * 2) {
      reasons.push(`互动率是最低要求的 ${Math.floor(influencer.engagementRate / criteria.minEngagementRate * 100 - 100)}%`);
    }

    if (influencer.qualityScore && influencer.qualityScore >= 80) {
      reasons.push('内容质量优秀');
    }

    if (influencer.cooperationCount > 0) {
      reasons.push(`有过 ${influencer.cooperationCount} 次成功合作`);
    }

    return reasons;
  }

  /**
   * 估算价格
   */
  private estimatePrice(influencer: InfluencerMatch, priceLimit?: number): number {
    if (influencer.averagePrice) {
      const price = Number(influencer.averagePrice);
      // 如果设置了价格上限，确保不超过
      if (priceLimit && price > priceLimit) {
        return priceLimit;
      }
      return price;
    }

    // 根据粉丝数和互动率估算
    const estimatedPrice = (influencer.subscriberCount / 10000) *
                          (influencer.engagementRate || 1) * 50;

    const price = Math.round(estimatedPrice);

    // 如果设置了价格上限，确保不超过
    if (priceLimit && price > priceLimit) {
      return priceLimit;
    }

    return price;
  }

  /**
   * 获取匹配的达人列表
   */
  async getMatchedInfluencers(campaignId: string): Promise<MatchedInfluencer[]> {
    const matches = await db
      .select()
      .from(campaignAutoMatches)
      .where(sql`${campaignAutoMatches.campaignId} = ${campaignId}`);

    const matchedInfluencers: MatchedInfluencer[] = [];

    for (const match of matches) {
      const [influencer] = await db
        .select()
        .from(influencers)
        .where(sql`${influencers.id} = ${match.influencerId}`)
        .limit(1);

      if (influencer) {
        matchedInfluencers.push({
          influencerId: match.influencerId,
          influencer: this.mapToMatchedInfluencer(influencer),
          estimatedPrice: match.estimatedPrice,
          matchScore: match.matchScore,
          matchReason: JSON.parse(match.matchReason || '[]'),
        });
      }
    }

    return matchedInfluencers;
  }

  /**
   * 更新匹配状态
   */
  async updateMatchStatus(
    matchId: string,
    status: string,
    data?: Record<string, any>
  ): Promise<void> {
    const updateData: Record<string, any> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'sent' && !updateData.invitedAt) {
      updateData.invitedAt = new Date();
    }

    if (status === 'responded' && !updateData.respondedAt) {
      updateData.respondedAt = new Date();
    }

    if (data) {
      Object.assign(updateData, data);
    }

    await db
      .update(campaignAutoMatches)
      .set(updateData)
      .where(sql`${campaignAutoMatches.id} = ${matchId}`);

    logger.info('Match status updated', { matchId, status });
  }

  /**
   * 删除所有匹配记录
   */
  async clearMatches(campaignId: string): Promise<void> {
    await db
      .delete(campaignAutoMatches)
      .where(sql`${campaignAutoMatches.campaignId} = ${campaignId}`);

    logger.info('All matches cleared', { campaignId });
  }

  /**
   * 映射到 InfluencerMatch
   */
  private mapToMatchedInfluencer(influencer: any): InfluencerMatch {
    return {
      id: influencer.id,
      channelId: influencer.channelId,
      channelTitle: influencer.channelTitle,
      thumbnail: influencer.thumbnail,
      subscriberCount: influencer.subscriberCount,
      totalVideos: influencer.totalVideos,
      totalViews: influencer.totalViews,
      email: influencer.email,
      phone: influencer.phone,
      wechat: influencer.wechat,
      category: influencer.category,
      niche: influencer.niche,
      level: influencer.level,
      priceRange: influencer.priceRange,
      averagePrice: influencer.averagePrice,
      qualityScore: influencer.qualityScore,
      cooperationScore: influencer.cooperationScore,
      engagementRate: influencer.engagementRate,
      status: influencer.status,
      isFavorite: influencer.isFavorite,
      cooperationCount: influencer.cooperationCount,
    };
  }
}

// 导出单例
export const autoMatchingService = AutoMatchingService.getInstance();
