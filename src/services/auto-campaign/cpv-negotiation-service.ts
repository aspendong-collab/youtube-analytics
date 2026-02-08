/**
 * 基于 CPV 的智能砍价服务
 * 实现"越便宜越好"的自动化砍价逻辑
 */

import { dbInstance as db } from '@/lib/db';
import { aiInfluencers, campaignAutoMatches, campaignNegotiationLogs } from '@/storage/database/shared/schema';
import { logger } from '@/core/logger';
import { cpvService, InfluencerCPVData, BudgetConstraints } from './cpv-calculation-service';
import { AIService } from '../ai';
import { generateId } from '@/shared/utils/string';
import { eq, and, sql } from 'drizzle-orm';

export interface CPVNegotiationRequest {
  campaignId: string;
  influencerId: string;
  autoMatchId?: string;
  influencerPrice: number; // 达人的报价
  totalBudget: number; // 总预算
  targetCPV?: number; // 目标 CPV
  priority?: 'cheapest' | 'balanced' | 'quality'; // 优先级，默认 cheapest
  maxRounds?: number; // 最大谈判轮次
}

export interface CPVNegotiationResponse {
  success: boolean;
  shouldContinue: boolean;
  nextOffer?: number;
  message: string;
  reason?: string;
  needsUserApproval?: boolean;
  cpvAnalysis?: {
    estimatedCPV: number;
    counterCPV: number;
    recommendedPrice: number;
    isGoodDeal: boolean;
    score: number;
  };
}

export class CPVNegotiationService {
  private static instance: CPVNegotiationService;
  private aiService = AIService.getInstance();

  private constructor() {}

  static getInstance(): CPVNegotiationService {
    if (!CPVNegotiationService.instance) {
      CPVNegotiationService.instance = new CPVNegotiationService();
    }
    return CPVNegotiationService.instance;
  }

  /**
   * 启动基于 CPV 的自动谈判
   */
  async startNegotiation(request: CPVNegotiationRequest): Promise<CPVNegotiationResponse> {
    logger.info('[CPV Negotiation] Starting negotiation', {
      campaignId: request.campaignId,
      influencerId: request.influencerId,
      influencerPrice: request.influencerPrice,
      totalBudget: request.totalBudget,
      priority: request.priority || 'cheapest',
    });

    try {
      // 1. 获取达人数据
      const [influencer] = await db
        .select()
        .from(aiInfluencers)
        .where(eq(aiInfluencers.id, request.influencerId))
        .limit(1);

      if (!influencer) {
        throw new Error(`Influencer not found: ${request.influencerId}`);
      }

      // 2. 转换为 CPV 计算格式
      const influencerCPVData: InfluencerCPVData = {
        channelId: influencer.channelId,
        channelTitle: influencer.channelTitle,
        avgViews: influencer.avgViews || 0,
        subscriberCount: influencer.subscriberCount || 0,
        engagementRate: parseFloat(influencer.engagementRate || '0'),
        avgLikes: influencer.avgLikes || 0,
        avgComments: influencer.avgComments || 0,
        avgDuration: influencer.avgDurationSeconds || 0,
      };

      // 3. 构建预算约束
      const budget: BudgetConstraints = {
        totalBudget: request.totalBudget,
        targetCPV: request.targetCPV,
        priority: request.priority || 'cheapest',
      };

      // 4. 计算 CPV 和推荐价格
      const cpvResult = cpvService.calculateCPV(influencerCPVData, budget);

      logger.info('[CPV Negotiation] CPV analysis completed', {
        estimatedCPV: cpvResult.estimatedCPV,
        recommendedPrice: cpvResult.recommendedPrice,
        initialOffer: cpvResult.initialOffer,
        isGoodDeal: cpvResult.isGoodDeal,
      });

      // 5. 判断是否是好交易
      if (cpvResult.isGoodDeal && request.influencerPrice <= cpvResult.maxPrice) {
        // 好交易，直接接受
        logger.info('[CPV Negotiation] Good deal, accepting immediately', {
          influencerPrice: request.influencerPrice,
          recommendedPrice: cpvResult.recommendedPrice,
        });

        await this.recordNegotiation({
          ...request,
          status: 'accepted',
          finalPrice: request.influencerPrice,
          rounds: 0,
          cpvResult,
        });

        return {
          success: true,
          shouldContinue: false,
          message: `达人报价合理（CPV: ${(request.influencerPrice / influencerCPVData.avgViews).toFixed(4)}），直接接受！`,
          reason: 'Good deal, immediate acceptance',
          cpvAnalysis: {
            estimatedCPV: cpvResult.estimatedCPV,
            counterCPV: request.influencerPrice / influencerCPVData.avgViews,
            recommendedPrice: cpvResult.recommendedPrice,
            isGoodDeal: true,
            score: cpvResult.cpvScore,
          },
        };
      }

      // 6. 创建谈判记录
      const firstOffer = cpvResult.initialOffer;
      const negotiationId = generateId();

      await db
        .insert(campaignNegotiationLogs)
        .values({
          id: negotiationId,
          campaignId: request.campaignId,
          influencerId: request.influencerId,
          autoMatchId: request.autoMatchId || null,
          initialPrice: request.influencerPrice,
          ourOffer: firstOffer,
          budgetLimit: budget.totalBudget,
          negotiationRounds: 0,
          maxRounds: request.maxRounds || 5,
          aiStrategyUsed: request.priority || 'cheapest',
          status: 'in_progress',
          startedAt: new Date(),
          messages: JSON.stringify([
            {
              role: 'system',
              content: `You are a professional negotiator focused on getting the best possible price based on CPV analysis.
              Priority: ${request.priority || 'cheapest'} (越便宜越好)
              Estimated CPV: ${cpvResult.estimatedCPV.toFixed(4)}
              Market CPV: ${cpvResult.marketCPV.toFixed(4)}
              Target: Achieve the lowest possible price while maintaining quality.`,
              timestamp: new Date().toISOString(),
            },
            {
              role: 'user',
              content: `Influencer's initial price: $${request.influencerPrice}
              Average views: ${influencerCPVData.avgViews.toLocaleString()}
              Our calculated initial offer: $${firstOffer}
              CPV factors: ${cpvResult.factors.join(', ')}
              Please respond with our counter-offer.`,
              timestamp: new Date().toISOString(),
              price: request.influencerPrice,
            },
          ]),
        });

      // 7. 生成 AI 回复
      const aiResponse = await this.generateNegotiationMessage({
        ourOffer: firstOffer,
        strategy: cpvResult.negotiationStrategy,
        factors: cpvResult.factors,
        priority: request.priority || 'cheapest',
      });

      logger.info('[CPV Negotiation] Started successfully', {
        negotiationId,
        firstOffer,
        strategy: cpvResult.negotiationStrategy,
      });

      return {
        success: true,
        shouldContinue: true,
        nextOffer: firstOffer,
        message: aiResponse,
        reason: cpvResult.negotiationStrategy,
        cpvAnalysis: {
          estimatedCPV: cpvResult.estimatedCPV,
          counterCPV: request.influencerPrice / influencerCPVData.avgViews,
          recommendedPrice: cpvResult.recommendedPrice,
          isGoodDeal: false,
          score: cpvResult.cpvScore,
        },
      };

    } catch (error) {
      logger.error('[CPV Negotiation] Failed to start', error as Error, {
        campaignId: request.campaignId,
        influencerId: request.influencerId,
      });

      return {
        success: false,
        shouldContinue: false,
        message: `Failed to start negotiation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 处理达人的回复（继续砍价）
   */
  async handleCounterOffer(
    negotiationId: string,
    counterOffer: number,
    message: string
  ): Promise<CPVNegotiationResponse> {
    logger.info('[CPV Negotiation] Handling counter offer', {
      negotiationId,
      counterOffer,
    });

    try {
      // 1. 获取谈判记录
      const [negotiation] = await db
        .select()
        .from(campaignNegotiationLogs)
        .where(eq(campaignNegotiationLogs.id, negotiationId))
        .limit(1);

      if (!negotiation) {
        throw new Error('Negotiation not found');
      }

      // 2. 获取达人数据
      const [influencer] = await db
        .select()
        .from(aiInfluencers)
        .where(eq(aiInfluencers.id, negotiation.influencerId))
        .limit(1);

      if (!influencer) {
        throw new Error('Influencer not found');
      }

      // 3. 计算当前轮次
      const currentRound = (negotiation.negotiationRounds || 0) + 1;
      const maxRounds = negotiation.maxRounds || 5;

      // 4. 构建 CPV 数据
      const influencerCPVData: InfluencerCPVData = {
        channelId: influencer.channelId,
        channelTitle: influencer.channelTitle,
        avgViews: influencer.avgViews || 0,
        subscriberCount: influencer.subscriberCount || 0,
        engagementRate: parseFloat(influencer.engagementRate || '0'),
        avgLikes: influencer.avgLikes || 0,
        avgComments: influencer.avgComments || 0,
        avgDuration: influencer.avgDurationSeconds || 0,
      };

      const budget: BudgetConstraints = {
        totalBudget: Number(negotiation.budgetLimit || 0),
        priority: (negotiation.aiStrategyUsed as any) || 'cheapest',
      };

      // 5. 计算优化后的报价
      const optimizedOffer = cpvService.calculateOptimizedOffer(
        influencerCPVData,
        budget,
        counterOffer,
        currentRound
      );

      logger.info('[CPV Negotiation] Optimized offer calculated', {
        counterOffer,
        counterCPV: counterOffer / influencerCPVData.avgViews,
        shouldContinue: optimizedOffer.shouldContinue,
        nextOffer: optimizedOffer.nextOffer,
        reason: optimizedOffer.reason,
        currentRound,
        maxRounds,
      });

      // 6. 判断是否继续
      if (!optimizedOffer.shouldContinue) {
        // 停止谈判
        const status = optimizedOffer.nextOffer !== null ? 'accepted' : 'user_intervention';

        await db
          .update(campaignNegotiationLogs)
          .set({
            status,
            counterOffer,
            finalPrice: optimizedOffer.nextOffer || null,
            negotiationRounds: currentRound,
            completedAt: new Date(),
          })
          .where(eq(campaignNegotiationLogs.id, negotiationId));

        return {
          success: true,
          shouldContinue: false,
          nextOffer: optimizedOffer.nextOffer,
          message: status === 'accepted'
            ? `接受报价 $${counterOffer}！CPV: ${(counterOffer / influencerCPVData.avgViews).toFixed(4)}`
            : `对方报价 $${counterOffer}，${optimizedOffer.reason}`,
          reason: optimizedOffer.reason,
          needsUserApproval: status === 'user_intervention',
        };
      }

      // 7. 检查是否超过最大轮次
      if (currentRound >= maxRounds) {
        await db
          .update(campaignNegotiationLogs)
          .set({
            status: 'user_intervention',
            counterOffer,
            negotiationRounds: currentRound,
          })
          .where(eq(campaignNegotiationLogs.id, negotiationId));

        return {
          success: true,
          shouldContinue: false,
          message: `已达到最大谈判轮次（${maxRounds}轮），对方报价 $${counterOffer}`,
          reason: 'Maximum rounds reached',
          needsUserApproval: true,
        };
      }

      // 8. 生成 AI 回复
      const aiResponse = await this.generateNegotiationMessage({
        ourOffer: optimizedOffer.nextOffer!,
        counterOffer,
        factors: [],
        priority: budget.priority,
        round: currentRound,
        maxRounds,
      });

      // 9. 更新谈判记录
      await db
        .update(campaignNegotiationLogs)
        .set({
          ourOffer: optimizedOffer.nextOffer,
          counterOffer,
          negotiationRounds: currentRound,
        })
        .where(eq(campaignNegotiationLogs.id, negotiationId));

      return {
        success: true,
        shouldContinue: true,
        nextOffer: optimizedOffer.nextOffer,
        message: aiResponse,
        reason: optimizedOffer.reason,
      };

    } catch (error) {
      logger.error('[CPV Negotiation] Failed to handle counter offer', error as Error, {
        negotiationId,
      });

      return {
        success: false,
        shouldContinue: false,
        message: `Failed to handle counter offer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 生成谈判消息（AI）
   */
  private async generateNegotiationMessage(context: {
    ourOffer: number;
    counterOffer?: number;
    strategy?: string;
    factors: string[];
    priority: string;
    round?: number;
    maxRounds?: number;
  }): Promise<string> {
    const { ourOffer, counterOffer, strategy, factors, priority, round, maxRounds } = context;

    const systemPrompt = `You are a professional business negotiator. Your role is to:
1. Get the best possible price (越便宜越好)
2. Be respectful but firm
3. Use data-driven arguments
4. Highlight value proposition
5. Focus on long-term partnership

Priority: ${priority === 'cheapest' ? 'MINIMUM PRICE' : 'BALANCED QUALITY AND PRICE'}

Your response should be:
- Professional and polite
- Data-driven (mention CPV, views, engagement)
- Persuasive but respectful
- Clear about your offer`;

    let userPrompt = '';

    if (counterOffer) {
      // 回复对方的报价
      userPrompt = `Their counter-offer: $${counterOffer}
Our new offer: $${ourOffer}
Current round: ${round}/${maxRounds}

Please draft a response with our new offer of $${ourOffer}. Be firm but professional.`;
    } else {
      // 首次报价
      userPrompt = `Influencer's initial price: Not specified yet
Our initial offer: $${ourOffer}
Strategy: ${strategy || 'standard'}
Factors: ${factors.join(', ')}

Please draft a professional opening message with our offer of $${ourOffer}. Emphasize data-driven pricing and long-term partnership.`;
    }

    try {
      const response = await this.aiService.generateText(userPrompt, {
        systemPrompt,
        temperature: 0.7,
      });

      return response;
    } catch (error) {
      logger.error('[CPV Negotiation] Failed to generate message', error as Error);
      return this.getDefaultMessage(context);
    }
  }

  /**
   * 获取默认消息
   */
  private getDefaultMessage(context: {
    ourOffer: number;
    counterOffer?: number;
    priority: string;
  }): string {
    const { ourOffer, counterOffer, priority } = context;

    if (counterOffer) {
      return `Thank you for your response. After careful consideration of our budget and campaign goals, we can offer $${ourOffer}. This price reflects our data-driven analysis and ensures a fair partnership for both parties. We believe this offer represents excellent value and we're excited about the potential collaboration.`;
    }

    return `Hello! Based on our campaign analysis and data-driven approach, we're excited to invite you to collaborate with us. After analyzing your channel metrics, engagement rate, and expected reach, we'd like to offer $${ourOffer} for this partnership. We believe this is a fair price that reflects the value you'll bring to our campaign and ensures a successful long-term relationship. Let us know your thoughts!`;
  }

  /**
   * 记录谈判结果
   */
  private async recordNegotiation(data: {
    campaignId: string;
    influencerId: string;
    autoMatchId?: string;
    status: string;
    finalPrice: number;
    rounds: number;
    cpvResult: any;
  }): Promise<void> {
    await db.insert(campaignNegotiationLogs).values({
      id: generateId(),
      campaignId: data.campaignId,
      influencerId: data.influencerId,
      autoMatchId: data.autoMatchId || null,
      initialPrice: data.finalPrice,
      ourOffer: data.finalPrice,
      counterOffer: data.finalPrice,
      finalPrice: data.finalPrice,
      budgetLimit: data.cpvResult.recommendedPrice,
      negotiationRounds: data.rounds,
      maxRounds: 1,
      aiStrategyUsed: 'cheapest',
      status: data.status as any,
      startedAt: new Date(),
      completedAt: new Date(),
      messages: JSON.stringify([{
        role: 'system',
        content: `Good deal accepted immediately. CPV: ${data.cpvResult.estimatedCPV}`,
        timestamp: new Date().toISOString(),
      }]),
    });
  }
}

// 导出单例
export const cpvNegotiationService = CPVNegotiationService.getInstance();
