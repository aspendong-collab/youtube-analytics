/**
 * 自动谈判服务
 * 基于 AI 的智能谈判系统
 */

import { dbInstance as db } from '@/lib/db';
import { campaignNegotiationLogs } from '@/storage/database/shared/schema';
import { logger } from '@/core/logger';
import { AIService } from '../ai';
import { generateId } from '@/shared/utils/string';
import {
  NegotiationRequest,
  NegotiationResponse,
  Negotiation,
  NegotiationStatus,
  NegotiationStrategy
} from './types';
import { eq, sql } from 'drizzle-orm';

export class AutoNegotiationService {
  private static instance: AutoNegotiationService;
  private aiService = AIService.getInstance();

  private constructor() {}

  static getInstance(): AutoNegotiationService {
    if (!AutoNegotiationService.instance) {
      AutoNegotiationService.instance = new AutoNegotiationService();
    }
    return AutoNegotiationService.instance;
  }

  /**
   * 开始自动谈判
   */
  async startNegotiation(request: NegotiationRequest): Promise<Negotiation> {
    logger.info('Starting negotiation', {
      campaignId: request.campaignId,
      influencerId: request.influencerId,
      initialPrice: request.initialPrice,
      strategy: request.strategy,
    });

    try {
      // 计算首次报价
      const firstOffer = this.calculateFirstOffer(
        request.initialPrice,
        request.budgetLimit,
        request.strategy
      );

      // 创建谈判记录
      const [negotiation] = await db
        .insert(campaignNegotiationLogs)
        .values({
          id: generateId(),
          campaignId: request.campaignId,
          influencerId: request.influencerId,
          autoMatchId: null,
          initialPrice: request.initialPrice,
          ourOffer: firstOffer,
          negotiationRounds: 0,
          maxRounds: request.maxRounds,
          aiStrategyUsed: request.strategy,
          status: 'in_progress',
          startedAt: new Date(),
          messages: JSON.stringify([
            {
              role: 'system',
              content: `You are a professional negotiator. Your goal is to reach an agreement within the budget limit of $${request.budgetLimit}. Use ${request.strategy} strategy.`,
              timestamp: new Date().toISOString(),
            },
            {
              role: 'user',
              content: `The influencer's initial price is $${request.initialPrice}. Please respond with a counter-offer.`,
              timestamp: new Date().toISOString(),
              price: request.initialPrice,
            },
          ]),
        })
        .returning();

      // 生成 AI 回复
      const aiResponse = await this.generateNegotiationResponse({
        negotiation,
        ourOffer: firstOffer,
        strategy: request.strategy,
        budgetLimit: request.budgetLimit,
      });

      // 更新消息历史
      const messages = JSON.parse(negotiation.messages || '[]');
      messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        price: firstOffer,
      });

      await db
        .update(campaignNegotiationLogs)
        .set({ messages: JSON.stringify(messages) })
        .where(eq(campaignNegotiationLogs.id, negotiation.id));

      logger.info('Negotiation started successfully', {
        negotiationId: negotiation.id,
        firstOffer,
      });

      return negotiation as Negotiation;

    } catch (error) {
      logger.error('Failed to start negotiation', error as Error, {
        campaignId: request.campaignId,
        influencerId: request.influencerId,
      });
      throw error;
    }
  }

  /**
   * 处理博主的回复
   */
  async handleResponse(
    negotiationId: string,
    counterOffer: number,
    message: string
  ): Promise<NegotiationResponse> {
    const [negotiation] = await db
      .select()
      .from(campaignNegotiationLogs)
      .where(eq(campaignNegotiationLogs.id, negotiationId))
      .limit(1);

    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    const messages = JSON.parse(negotiation.messages || '[]');
    const currentRound = (negotiation.negotiationRounds || 0) + 1;

    // 添加博主的回复
    messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      price: counterOffer,
    });

    // 评估报价
    const evaluation = this.evaluateOffer(
      counterOffer,
      Number(negotiation.budgetLimit || 0),
      currentRound,
      Number(negotiation.maxRounds || 5)
    );

    if (evaluation.accept) {
      // 接受报价
      await db
        .update(campaignNegotiationLogs)
        .set({
          status: 'accepted',
          counterOffer: counterOffer,
          finalPrice: counterOffer,
          negotiationRounds: currentRound,
          completedAt: new Date(),
          messages: JSON.stringify(messages),
        })
        .where(eq(campaignNegotiationLogs.id, negotiationId));

      return {
        shouldContinue: false,
        nextOffer: null,
        response: `Great! We accept your offer of $${counterOffer}. Let's proceed with the collaboration.`,
        reason: evaluation.reason,
      };
    }

    if (currentRound >= Number(negotiation.maxRounds || 5)) {
      // 超过最大轮次，需要用户介入
      await db
        .update(campaignNegotiationLogs)
        .set({
          status: 'user_intervention',
          counterOffer: counterOffer,
          negotiationRounds: currentRound,
          messages: JSON.stringify(messages),
        })
        .where(eq(campaignNegotiationLogs.id, negotiationId));

      return {
        shouldContinue: false,
        nextOffer: null,
        response: `We've reached the maximum negotiation rounds. The influencer's offer is $${counterOffer}. Waiting for your decision.`,
        needsUserApproval: true,
        reason: evaluation.reason,
      };
    }

    if (evaluation.shouldContinue) {
      // 继续谈判，计算下一轮报价
      const nextOffer = this.calculateNextOffer(
        counterOffer,
        Number(negotiation.budgetLimit || 0),
        negotiation.aiStrategyUsed as NegotiationStrategy,
        currentRound,
        Number(negotiation.maxRounds || 5)
      );

      // 生成 AI 回复
      const aiResponse = await this.generateNegotiationResponse({
        negotiation,
        ourOffer: nextOffer,
        strategy: negotiation.aiStrategyUsed as NegotiationStrategy,
        budgetLimit: Number(negotiation.budgetLimit || 0),
      });

      messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        price: nextOffer,
      });

      await db
        .update(campaignNegotiationLogs)
        .set({
          ourOffer: nextOffer,
          negotiationRounds: currentRound,
          messages: JSON.stringify(messages),
        })
        .where(eq(campaignNegotiationLogs.id, negotiationId));

      return {
        shouldContinue: true,
        nextOffer,
        response: aiResponse,
        reason: evaluation.reason,
      };
    }

    // 超出预算，需要用户介入
    await db
      .update(campaignNegotiationLogs)
      .set({
        status: 'user_intervention',
        counterOffer: counterOffer,
        negotiationRounds: currentRound,
        messages: JSON.stringify(messages),
      })
      .where(eq(campaignNegotiationLogs.id, negotiationId));

    return {
      shouldContinue: false,
      nextOffer: null,
      response: `The influencer's offer of $${counterOffer} exceeds our budget. Waiting for your decision.`,
      needsUserApproval: true,
      reason: evaluation.reason,
    };
  }

  /**
   * 计算首次报价
   */
  private calculateFirstOffer(
    initialPrice: number,
    budgetLimit: number,
    strategy: NegotiationStrategy
  ): number {
    switch (strategy) {
      case 'aggressive':
        return Math.min(initialPrice * 0.6, budgetLimit * 0.7);
      case 'moderate':
        return Math.min(initialPrice * 0.75, budgetLimit * 0.8);
      case 'conservative':
        return Math.min(initialPrice * 0.85, budgetLimit * 0.9);
      default:
        return Math.min(initialPrice * 0.75, budgetLimit * 0.8);
    }
  }

  /**
   * 计算下一轮报价
   */
  private calculateNextOffer(
    counterOffer: number,
    budgetLimit: number,
    strategy: NegotiationStrategy,
    currentRound: number,
    maxRounds: number
  ): number {
    const progress = currentRound / maxRounds;
    let offer: number;

    switch (strategy) {
      case 'aggressive':
        // 进取策略：每轮增加 15-20%
        offer = counterOffer * (1 + (0.15 + progress * 0.05));
        break;
      case 'moderate':
        // 温和策略：每轮增加 10-15%
        offer = counterOffer * (1 + (0.10 + progress * 0.05));
        break;
      case 'conservative':
        // 保守策略：每轮增加 5-10%
        offer = counterOffer * (1 + (0.05 + progress * 0.05));
        break;
      default:
        offer = counterOffer * 1.1;
    }

    // 确保不超过预算
    return Math.min(offer, budgetLimit);
  }

  /**
   * 评估报价
   */
  private evaluateOffer(
    offer: number,
    budgetLimit: number,
    currentRound: number,
    maxRounds: number
  ): {
    accept: boolean;
    shouldContinue: boolean;
    reason: string;
  } {
    if (offer <= budgetLimit * 0.8) {
      // 报价在预算的 80% 以内，接受
      return {
        accept: true,
        shouldContinue: false,
        reason: 'Offer is within acceptable budget range (≤80% of limit)',
      };
    }

    if (offer <= budgetLimit) {
      // 报价在预算范围内，但接近上限
      if (currentRound >= maxRounds - 1) {
        // 最后一轮，接受
        return {
          accept: true,
          shouldContinue: false,
          reason: 'Last round, accepting offer within budget',
        };
      }
      // 继续尝试谈判
      return {
        accept: false,
        shouldContinue: true,
        reason: 'Offer is within budget but near limit, continuing negotiation',
      };
    }

    // 超出预算
    return {
      accept: false,
      shouldContinue: false,
      reason: `Offer of $${offer} exceeds budget limit of $${budgetLimit}`,
    };
  }

  /**
   * 生成谈判回复（AI）
   */
  private async generateNegotiationResponse(context: any): Promise<string> {
    const systemPrompt = `You are a professional business negotiator. Your role is to:
1. Be respectful and professional
2. Explain your reasoning clearly
3. Focus on win-win outcomes
4. Highlight long-term collaboration potential
5. Stay within the budget constraints

Your response should be polite but firm when negotiating price.`;

    const userPrompt = `Context:
- Our budget limit: $${context.budgetLimit}
- Our offer: $${context.ourOffer}
- Strategy: ${context.strategy}

Please draft a professional response to the influencer with our counter-offer of $${context.ourOffer}.`;

    try {
      const response = await this.aiService.generateText(userPrompt, {
        systemPrompt,
        temperature: 0.7,
      });

      return response;
    } catch (error) {
      logger.error('Failed to generate negotiation response', error as Error);
      // 返回默认回复
      return `Thank you for your response. Based on our budget constraints, we can offer $${context.ourOffer} for this collaboration. We believe this is a fair price that reflects the value you'll bring to our campaign. Let us know if this works for you.`;
    }
  }
}

// 导出单例
export const autoNegotiationService = AutoNegotiationService.getInstance();
