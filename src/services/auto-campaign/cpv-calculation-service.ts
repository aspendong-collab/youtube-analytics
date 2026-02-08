/**
 * CPV (Cost Per View) 计算服务
 * 基于达人数据和预算计算合理的CPV和价格
 */

import { logger } from '@/core/logger';

export interface InfluencerCPVData {
  // 达人基础数据
  channelId: string;
  channelTitle: string;
  avgViews: number; // 平均观看次数
  subscriberCount: number; // 订阅者数量
  engagementRate: number; // 互动率 (0-100)
  avgLikes: number; // 平均点赞数
  avgComments: number; // 平均评论数
  avgDuration: number; // 平均视频时长（秒）
}

export interface CPVCalculationResult {
  // CPV 相关
  estimatedCPV: number; // 预估 CPV (成本 / 观看次数)
  marketCPV: number; // 市场平均 CPV
  cpvScore: number; // CPV 评分 (0-100, 越高性价比越高)
  isGoodDeal: boolean; // 是否是好交易

  // 价格相关
  recommendedPrice: number; // 推荐价格
  minPrice: number; // 最低价格
  maxPrice: number; // 最高价格
  initialOffer: number; // 首次报价

  // 分析结果
  factors: string[]; // 影响价格的因素
  priceRange: { min: number; max: number }; // 价格区间
  negotiationStrategy: string; // 推荐的谈判策略
}

export interface BudgetConstraints {
  totalBudget: number; // 总预算
  targetCPV?: number; // 目标 CPV（可选）
  minCPV?: number; // 最低 CPV
  maxCPV?: number; // 最高 CPV
  priority: 'cheapest' | 'balanced' | 'quality'; // 优先级
}

export class CPVCalculationService {
  private static instance: CPVCalculationService;

  // 行业基准 CPV（基于不同量级的达人）
  private readonly INDUSTRY_CPV_BASE = {
    micro: 0.02, // 1K-10K 订阅者
    mid: 0.05, // 10K-100K 订阅者
    macro: 0.10, // 100K-1M 订阅者
    mega: 0.20, // 1M+ 订阅者
  };

  // 视频时长系数（时长越长，CPV 越高）
  private readonly DURATION_MULTIPLIER = {
    short: 0.8, // <5 分钟
    medium: 1.0, // 5-15 分钟
    long: 1.2, // >15 分钟
  };

  // 互动率系数（互动率越高，CPV 越高）
  private readonly ENGAGEMENT_MULTIPLIER = {
    low: 0.7, // <3%
    medium: 1.0, // 3-8%
    high: 1.3, // >8%
  };

  private constructor() {}

  static getInstance(): CPVCalculationService {
    if (!CPVCalculationService.instance) {
      CPVCalculationService.instance = new CPVCalculationService();
    }
    return CPVCalculationService.instance;
  }

  /**
   * 计算 CPV 和推荐价格
   */
  calculateCPV(
    influencerData: InfluencerCPVData,
    budget: BudgetConstraints
  ): CPVCalculationResult {
    logger.info('[CPV] Calculating CPV', {
      channelId: influencerData.channelId,
      avgViews: influencerData.avgViews,
      totalBudget: budget.totalBudget,
      priority: budget.priority,
    });

    // 1. 确定达人的量级
    const tier = this.getInfluencerTier(influencerData.subscriberCount);
    const baseCPV = this.INDUSTRY_CPV_BASE[tier];

    // 2. 计算调整系数
    const durationFactor = this.getDurationFactor(influencerData.avgDuration);
    const engagementFactor = this.getEngagementFactor(influencerData.engagementRate);

    // 3. 计算预估 CPV
    const estimatedCPV = baseCPV * durationFactor * engagementFactor;

    // 4. 计算市场平均 CPV（基于互动率和观看次数）
    const marketCPV = this.calculateMarketCPV(influencerData);

    // 5. 计算推荐价格
    const recommendedPrice = this.calculateRecommendedPrice(
      influencerData,
      estimatedCPV,
      budget
    );

    // 6. 计算 CPV 评分
    const cpvScore = this.calculateCPVScore(
      estimatedCPV,
      marketCPV,
      influencerData
    );

    // 7. 判断是否是好交易
    const isGoodDeal = estimatedCPV <= marketCPV * 0.9;

    // 8. 计算价格区间和首次报价
    const { minPrice, maxPrice, initialOffer } = this.calculatePriceRange(
      recommendedPrice,
      estimatedCPV,
      budget
    );

    // 9. 生成影响因素和谈判策略
    const factors = this.generateFactors(
      influencerData,
      estimatedCPV,
      marketCPV
    );
    const negotiationStrategy = this.determineNegotiationStrategy(
      budget.priority,
      estimatedCPV,
      marketCPV
    );

    const result: CPVCalculationResult = {
      estimatedCPV,
      marketCPV,
      cpvScore,
      isGoodDeal,
      recommendedPrice,
      minPrice,
      maxPrice,
      initialOffer,
      factors,
      priceRange: { min: minPrice, max: maxPrice },
      negotiationStrategy,
    };

    logger.info('[CPV] Calculation completed', {
      channelId: influencerData.channelId,
      estimatedCPV,
      recommendedPrice,
      initialOffer,
      cpvScore,
    });

    return result;
  }

  /**
   * 获取达人量级
   */
  private getInfluencerTier(subscribers: number): keyof typeof this.INDUSTRY_CPV_BASE {
    if (subscribers < 10000) return 'micro';
    if (subscribers < 100000) return 'mid';
    if (subscribers < 1000000) return 'macro';
    return 'mega';
  }

  /**
   * 获取时长系数
   */
  private getDurationFactor(duration: number): number {
    if (duration < 300) return this.DURATION_MULTIPLIER.short; // < 5 分钟
    if (duration < 900) return this.DURATION_MULTIPLIER.medium; // 5-15 分钟
    return this.DURATION_MULTIPLIER.long; // > 15 分钟
  }

  /**
   * 获取互动率系数
   */
  private getEngagementFactor(engagementRate: number): number {
    if (engagementRate < 3) return this.ENGAGEMENT_MULTIPLIER.low;
    if (engagementRate < 8) return this.ENGAGEMENT_MULTIPLIER.medium;
    return this.ENGAGEMENT_MULTIPLIER.high;
  }

  /**
   * 计算市场平均 CPV
   */
  private calculateMarketCPV(data: InfluencerCPVData): number {
    // 基于互动率和观看次数计算市场 CPV
    const engagementFactor = data.engagementRate / 5; // 标准化互动率
    const viewFactor = Math.log10(data.avgViews + 1); // 观看次数对数
    const baseCPV = 0.03; // 基础 CPV

    return baseCPV * (1 + engagementFactor) * (1 + viewFactor * 0.1);
  }

  /**
   * 计算推荐价格
   */
  private calculateRecommendedPrice(
    data: InfluencerCPVData,
    estimatedCPV: number,
    budget: BudgetConstraints
  ): number {
    // 基于 CPV 计算推荐价格
    let price = estimatedCPV * data.avgViews;

    // 根据优先级调整
    switch (budget.priority) {
      case 'cheapest':
        // 最低价格优先：取推荐价格的 60%
        price *= 0.6;
        break;
      case 'balanced':
        // 平衡：取推荐价格的 75%
        price *= 0.75;
        break;
      case 'quality':
        // 质量优先：取推荐价格的 90%
        price *= 0.9;
        break;
    }

    // 确保不超过预算
    return Math.min(price, budget.totalBudget);
  }

  /**
   * 计算 CPV 评分
   */
  private calculateCPVScore(
    estimatedCPV: number,
    marketCPV: number,
    data: InfluencerCPVData
  ): number {
    // CPV 越低，评分越高
    const cpvRatio = marketCPV / estimatedCPV; // 越大越好
    let score = Math.min(cpvRatio * 50, 100); // 0-100 分

    // 根据互动率调整评分
    const engagementScore = data.engagementRate * 2; // 最高 20 分
    score = Math.min(score + engagementScore, 100);

    return Math.round(score);
  }

  /**
   * 计算价格区间和首次报价
   */
  private calculatePriceRange(
    recommendedPrice: number,
    estimatedCPV: number,
    budget: BudgetConstraints
  ): { minPrice: number; maxPrice: number; initialOffer: number } {
    // 价格区间：推荐价格的 50% - 120%
    const minPrice = Math.max(recommendedPrice * 0.5, 0);
    const maxPrice = recommendedPrice * 1.2;

    // 首次报价：越便宜越好，从最低价格开始
    let initialOffer = minPrice;

    // 根据优先级调整首次报价
    switch (budget.priority) {
      case 'cheapest':
        // 最低价格：取 minPrice
        initialOffer = minPrice;
        break;
      case 'balanced':
        // 平衡：取 minPrice 的 80%
        initialOffer = minPrice * 0.8;
        break;
      case 'quality':
        // 质量：取 minPrice 的 60%
        initialOffer = minPrice * 0.6;
        break;
    }

    return {
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      initialOffer: Math.round(initialOffer * 100) / 100,
    };
  }

  /**
   * 生成影响因素
   */
  private generateFactors(
    data: InfluencerCPVData,
    estimatedCPV: number,
    marketCPV: number
  ): string[] {
    const factors: string[] = [];

    // 观看次数
    factors.push(`平均观看次数：${data.avgViews.toLocaleString()}`);

    // 互动率
    factors.push(`互动率：${data.engagementRate.toFixed(2)}%`);

    // CPV 对比
    if (estimatedCPV < marketCPV) {
      factors.push(`CPV 低于市场 ${(1 - estimatedCPV / marketCPV * 100).toFixed(1)}%，性价比高`);
    } else {
      factors.push(`CPV 高于市场 ${(estimatedCPV / marketCPV * 100 - 100).toFixed(1)}%，需谨慎`);
    }

    // 订阅者量级
    const tier = this.getInfluencerTier(data.subscriberCount);
    factors.push(`达人量级：${tier} (${data.subscriberCount.toLocaleString()} 订阅者)`);

    // 视频时长
    factors.push(`平均视频时长：${Math.round(data.avgDuration / 60)} 分钟`);

    return factors;
  }

  /**
   * 确定谈判策略
   */
  private determineNegotiationStrategy(
    priority: string,
    estimatedCPV: number,
    marketCPV: number
  ): string {
    if (priority === 'cheapest') {
      return 'aggressive_lowball'; // 激进压价
    }

    if (estimatedCPV <= marketCPV * 0.8) {
      return 'quick_accept'; // 快速接受（好交易）
    }

    if (estimatedCPV >= marketCPV * 1.2) {
      return 'aggressive_negotiation'; // 激进谈判
    }

    return 'standard_negotiation'; // 标准谈判
  }

  /**
   * 计算优化后的报价（基于对方报价）
   */
  calculateOptimizedOffer(
    influencerData: InfluencerCPVData,
    budget: BudgetConstraints,
    counterOffer: number,
    round: number
  ): { shouldContinue: boolean; nextOffer: number; reason: string } {
    const cpvResult = this.calculateCPV(influencerData, budget);
    const counterCPV = counterOffer / influencerData.avgViews;

    logger.info('[CPV] Calculating optimized offer', {
      counterOffer,
      counterCPV,
      estimatedCPV: cpvResult.estimatedCPV,
      round,
    });

    // 如果对方报价已经很低（低于预估 CPV 的 80%），接受
    if (counterCPV <= cpvResult.estimatedCPV * 0.8) {
      return {
        shouldContinue: false,
        nextOffer: counterOffer,
        reason: '对方报价已低于预估 CPV，接受',
      };
    }

    // 如果对方报价超出预算，停止谈判
    if (counterOffer > budget.totalBudget) {
      return {
        shouldContinue: false,
        nextOffer: null,
        reason: '对方报价超出预算，需要人工介入',
      };
    }

    // 计算下一轮报价
    let nextOffer: number;

    // 根据 CPV 差异和谈判轮次调整
    const cpvRatio = counterCPV / cpvResult.estimatedCPV;
    const roundProgress = round / 5; // 假设最多 5 轮

    if (budget.priority === 'cheapest') {
      // 越便宜越好：每轮只增加 5-10%
      nextOffer = counterOffer * (1 - 0.05 - roundProgress * 0.02);
    } else if (budget.priority === 'balanced') {
      // 平衡：每轮增加 8-12%
      nextOffer = counterOffer * (1 - 0.03 - roundProgress * 0.01);
    } else {
      // 质量优先：每轮增加 10-15%
      nextOffer = counterOffer * (1 - 0.02 - roundProgress * 0.01);
    }

    // 确保不低于最低价格
    nextOffer = Math.max(nextOffer, cpvResult.minPrice);

    // 确保不超过预算
    nextOffer = Math.min(nextOffer, budget.totalBudget);

    return {
      shouldContinue: true,
      nextOffer: Math.round(nextOffer * 100) / 100,
      reason: `根据 CPV 计算和谈判进度，提出新报价`,
    };
  }
}

// 导出单例
export const cpvService = CPVCalculationService.getInstance();
