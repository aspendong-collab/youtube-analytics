import { NextRequest, NextResponse } from 'next/server';
import type { ScoreResult, RecommendationRequest, FilterCondition } from '@/types/influencer';

/**
 * 达人评分模型
 */
class ScoringModel {
  // 评分主方法
  scoreInfluencer(
    influencer: any,
    productProfile?: {
      keywords: string[];
      targetAudience: string;
      category: string;
      minSubscribers?: number;
      maxSubscribers?: number;
      requiredEngagement?: number;
    }
  ): ScoreResult {
    const breakdown = {
      audienceSize: this.scoreAudienceSize(influencer),
      audienceQuality: this.scoreAudienceQuality(influencer),
      contentQuality: this.scoreContentQuality(influencer),
      consistency: this.scoreConsistency(influencer),
      growthRate: this.scoreGrowthRate(influencer),
      trending: this.scoreTrending(influencer),
      potential: this.scorePotential(influencer),
      relevance: productProfile ? this.scoreRelevance(influencer, productProfile) : 0,
      costEfficiency: this.scoreCostEfficiency(influencer),
      partnershipHistory: 0,
    };

    const weights = {
      audienceSize: 10,
      audienceQuality: 10,
      contentQuality: 10,
      consistency: 10,
      growthRate: 15,
      trending: 10,
      potential: 5,
      relevance: 15,
      costEfficiency: 10,
      partnershipHistory: 5,
    };

    const total =
      breakdown.audienceSize * weights.audienceSize +
      breakdown.audienceQuality * weights.audienceQuality +
      breakdown.contentQuality * weights.contentQuality +
      breakdown.consistency * weights.consistency +
      breakdown.growthRate * weights.growthRate +
      breakdown.trending * weights.trending +
      breakdown.potential * weights.potential +
      breakdown.relevance * weights.relevance +
      breakdown.costEfficiency * weights.costEfficiency +
      breakdown.partnershipHistory * weights.partnershipHistory;

    const tier = this.determineTier(total);
    const recommendations = this.generateRecommendations(influencer, breakdown, tier);

    return {
      total: Math.round(total),
      breakdown,
      tier,
      recommendations,
    };
  }

  private scoreAudienceSize(influencer: any): number {
    const subs = influencer.subscriberCount;
    if (subs >= 1000000) return 1.0;
    if (subs >= 500000) return 0.9;
    if (subs >= 100000) return 0.8;
    if (subs >= 50000) return 0.7;
    if (subs >= 10000) return 0.6;
    if (subs >= 5000) return 0.5;
    if (subs >= 1000) return 0.3;
    return 0.1;
  }

  private scoreAudienceQuality(influencer: any): number {
    const engagement = influencer.engagementRate;
    if (engagement >= 10) return 1.0;
    if (engagement >= 7) return 0.9;
    if (engagement >= 5) return 0.8;
    if (engagement >= 3) return 0.7;
    if (engagement >= 2) return 0.5;
    if (engagement >= 1) return 0.3;
    return 0.1;
  }

  private scoreContentQuality(influencer: any): number {
    let score = 0.5;
    if (influencer.channelThumbnail) score += 0.2;
    if (influencer.recentVideos?.length >= 10) score += 0.1;
    if (influencer.avgTitleLength >= 30) score += 0.1;
    return Math.min(score, 1.0);
  }

  private scoreConsistency(influencer: any): number {
    if (!influencer.publishConsistency) return 0.5;
    return influencer.publishConsistency;
  }

  private scoreGrowthRate(influencer: any): number {
    const trend = influencer.viewsTrend || 0;
    if (trend >= 50) return 1.0;
    if (trend >= 30) return 0.9;
    if (trend >= 20) return 0.8;
    if (trend >= 10) return 0.7;
    if (trend >= 5) return 0.6;
    if (trend >= 0) return 0.5;
    if (trend >= -10) return 0.3;
    return 0.1;
  }

  private scoreTrending(influencer: any): number {
    const recentVideos = influencer.recentVideos || [];
    if (recentVideos.length < 3) return 0.5;

    const recentViewsData = recentVideos.slice(0, 3).map((v: any) => v.viewCount);
    const olderViews = recentVideos.slice(3, 6).map((v: any) => v.viewCount);

    if (olderViews.length === 0) return 0.5;

    const recentAvg = recentViewsData.reduce((a: number, b: number) => a + b, 0) / recentViewsData.length;
    const olderAvg = olderViews.reduce((a: number, b: number) => a + b, 0) / olderViews.length;

    if (olderAvg === 0) return 0.5;

    const ratio = recentAvg / olderAvg;
    if (ratio >= 1.5) return 1.0;
    if (ratio >= 1.2) return 0.9;
    if (ratio >= 1.0) return 0.7;
    if (ratio >= 0.8) return 0.5;
    return 0.3;
  }

  private scorePotential(influencer: any): number {
    let score = 0.5;
    const subs = influencer.subscriberCount;
    if (subs < 100000) score += 0.2;
    if (subs < 50000) score += 0.1;
    return Math.min(score, 1.0);
  }

  private scoreRelevance(influencer: any, product: any): number {
    let score = 0;
    const keywords = product.keywords.map((k: string) => k.toLowerCase());
    const description = (influencer.description || '').toLowerCase();
    const titles = (influencer.recentVideos || []).map((v: any) => (v.title || '').toLowerCase()).join(' ');

    const matchedKeywords = keywords.filter((kw: string) => description.includes(kw) || titles.includes(kw));
    score += (matchedKeywords.length / keywords.length) * 0.5;

    return Math.min(score, 1.0);
  }

  private scoreCostEfficiency(influencer: any): number {
    const subs = influencer.subscriberCount;
    const avgViews = influencer.avgViews;
    const engagement = influencer.engagementRate;

    const estimatedCost = Math.round(subs * 0.01 * (engagement / 5));
    const estimatedEngagement = Math.round(avgViews * (engagement / 100));
    const efficiency = estimatedCost > 0 ? estimatedEngagement / estimatedCost : 0;

    if (efficiency >= 10) return 1.0;
    if (efficiency >= 5) return 0.9;
    if (efficiency >= 3) return 0.8;
    if (efficiency >= 1) return 0.6;
    return 0.4;
  }

  private determineTier(total: number): 'tier1' | 'tier2' | 'tier3' | 'tier4' {
    if (total >= 80) return 'tier1';
    if (total >= 60) return 'tier2';
    if (total >= 40) return 'tier3';
    return 'tier4';
  }

  private generateRecommendations(influencer: any, breakdown: any, tier: string): string[] {
    const recommendations: string[] = [];

    if (tier === 'tier1') {
      recommendations.push('头部达人，适合品牌曝光');
      recommendations.push('建议提供定制化合作方案');
      recommendations.push('预算需求较高');
    } else if (tier === 'tier2') {
      recommendations.push('中腰部达人，平衡曝光和转化');
      recommendations.push('建议提供中等预算 + 联盟佣金');
    } else if (tier === 'tier3') {
      recommendations.push('长尾达人，高转化率');
      recommendations.push('建议提供免费产品 + 联盟佣金');
    } else {
      recommendations.push('新兴达人，性价比高');
      recommendations.push('建议提供产品授权 + 小额报酬');
      recommendations.push('适合长期培养');
    }

    if (breakdown.growthRate >= 0.7) {
      recommendations.push('快速增长中，现在合作收益可能更大');
    }

    if (breakdown.consistency >= 0.9) {
      recommendations.push('发布稳定，适合长期合作');
    }

    return recommendations;
  }
}

/**
 * 筛选引擎
 */
class ScreeningEngine {
  applyFilters(influencers: any[], filters: FilterCondition[]): any[] {
    return influencers.filter(influencer => {
      return filters.every(filter => this.checkCondition(influencer, filter));
    });
  }

  private checkCondition(influencer: any, filter: FilterCondition): boolean {
    const value = this.getFieldValue(influencer, filter.field);

    switch (filter.operator) {
      case 'gt': return value > filter.value;
      case 'gte': return value >= filter.value;
      case 'lt': return value < filter.value;
      case 'lte': return value <= filter.value;
      case 'eq': return value === filter.value;
      case 'ne': return value !== filter.value;
      case 'in': return Array.isArray(filter.value) && filter.value.includes(value);
      case 'nin': return Array.isArray(filter.value) && !filter.value.includes(value);
      case 'contains': return String(value).toLowerCase().includes(filter.value.toLowerCase());
      default: return true;
    }
  }

  private getFieldValue(influencer: any, field: string): any {
    const parts = field.split('.');
    let value = influencer;
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) return null;
    }
    return value;
  }
}

/**
 * 推荐引擎
 */
class RecommendationEngine {
  private scoringModel = new ScoringModel();
  private screeningEngine = new ScreeningEngine();

  async recommend(influencers: any[], request: RecommendationRequest) {
    console.log('开始推荐达人...');

    // 步骤1：应用筛选
    let filtered = influencers;

    if (request.product) {
      const customFilters: FilterCondition[] = [];
      if (request.product.minSubscribers) {
        customFilters.push({ field: 'subscriberCount', operator: 'gte', value: request.product.minSubscribers });
      }
      if (request.product.maxSubscribers) {
        customFilters.push({ field: 'subscriberCount', operator: 'lte', value: request.product.maxSubscribers });
      }
      if (request.product.minEngagement) {
        customFilters.push({ field: 'engagementRate', operator: 'gte', value: request.product.minEngagement });
      }

      if (customFilters.length > 0) {
        filtered = this.screeningEngine.applyFilters(filtered, customFilters);
      }
    }

    console.log(`筛选后: ${filtered.length} 个`);

    // 步骤2：评分
    const scored = filtered.map(influencer => ({
      ...influencer,
      score: this.scoringModel.scoreInfluencer(influencer, request.product),
    }));

    // 步骤3：排序
    const sorted = scored.sort((a, b) => b.score.total - a.score.total);

    // 步骤4：按Tier分组
    const tierGroups = {
      tier1: sorted.filter(s => s.score.tier === 'tier1'),
      tier2: sorted.filter(s => s.score.tier === 'tier2'),
      tier3: sorted.filter(s => s.score.tier === 'tier3'),
      tier4: sorted.filter(s => s.score.tier === 'tier4'),
    };

    // 步骤5：智能分配
    const recommended = this.allocateBudget(tierGroups, request);

    // 步骤6：生成替代方案
    const alternatives = sorted.filter(s => !recommended.includes(s)).slice(0, 50);

    console.log(`推荐完成: ${recommended.length} 个达人`);

    return {
      recommended,
      alternatives,
      summary: {
        totalFound: influencers.length,
        recommendedCount: recommended.length,
        budgetFit: this.checkBudgetFit(recommended, request.product.budget),
        avgScore: Math.round(
          recommended.reduce((sum, r) => sum + r.score.total, 0) / recommended.length
        ),
      },
    };
  }

  private allocateBudget(tierGroups: any, request: RecommendationRequest): any[] {
    const budget = request.product.budget;
    const targetCount = request.targetCount;

    const estimatedCosts = {
      tier1: 5000,
      tier2: 1000,
      tier3: 200,
      tier4: 50,
    };

    let selected: any[] = [];
    let remainingBudget = budget;

    // Tier1
    const tier1Count = Math.min(
      tierGroups.tier1.length,
      Math.floor(budget * 0.3 / estimatedCosts.tier1),
      Math.ceil(targetCount * 0.1)
    );
    selected.push(...tierGroups.tier1.slice(0, tier1Count));
    remainingBudget -= tier1Count * estimatedCosts.tier1;

    // Tier2
    const tier2Count = Math.min(
      tierGroups.tier2.length,
      Math.floor(remainingBudget * 0.5 / estimatedCosts.tier2),
      Math.ceil(targetCount * 0.3)
    );
    selected.push(...tierGroups.tier2.slice(0, tier2Count));
    remainingBudget -= tier2Count * estimatedCosts.tier2;

    // Tier3
    const tier3Count = Math.min(
      tierGroups.tier3.length,
      Math.floor(remainingBudget * 0.7 / estimatedCosts.tier3),
      Math.ceil(targetCount * 0.4)
    );
    selected.push(...tierGroups.tier3.slice(0, tier3Count));
    remainingBudget -= tier3Count * estimatedCosts.tier3;

    // Tier4
    const tier4Count = Math.min(
      tierGroups.tier4.length,
      Math.floor(remainingBudget / estimatedCosts.tier4),
      Math.ceil(targetCount * 0.2)
    );
    selected.push(...tierGroups.tier4.slice(0, tier4Count));

    // 如果不够，从备选中补充
    if (selected.length < targetCount) {
      const alternatives = [
        ...tierGroups.tier1.slice(tier1Count),
        ...tierGroups.tier2.slice(tier2Count),
        ...tierGroups.tier3.slice(tier3Count),
        ...tierGroups.tier4.slice(tier4Count),
      ];
      selected.push(...alternatives.slice(0, targetCount - selected.length));
    }

    return selected;
  }

  private checkBudgetFit(influencers: any[], budget: number): boolean {
    const estimatedCosts: Record<string, number> = {
      tier1: 5000,
      tier2: 1000,
      tier3: 200,
      tier4: 50,
    };

    const totalCost = influencers.reduce((sum, inf) => {
      return sum + (estimatedCosts[inf.score.tier] || 0);
    }, 0);

    return totalCost <= budget * 1.2;
  }
}

// 单例
const recommendationEngine = new RecommendationEngine();

/**
 * POST /api/influencers/score
 * 批量评分达人
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { influencers, product } = body;

    if (!influencers || !Array.isArray(influencers)) {
      return NextResponse.json(
        { error: 'Missing or invalid field: influencers' },
        { status: 400 }
      );
    }

    const scoringModel = new ScoringModel();
    const scored = influencers.map(influencer => ({
      ...influencer,
      score: scoringModel.scoreInfluencer(influencer, product),
    }));

    return NextResponse.json({
      success: true,
      data: scored,
    });
  } catch (error) {
    console.error('Score influencers error:', error);
    return NextResponse.json(
      { error: 'Failed to score influencers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/influencers/recommend
 * 智能推荐达人
 */
export async function POST_recommend(request: NextRequest) {
  try {
    const body = await request.json();
    const { influencers, request: req } = body;

    if (!influencers || !Array.isArray(influencers)) {
      return NextResponse.json(
        { error: 'Missing or invalid field: influencers' },
        { status: 400 }
      );
    }

    if (!req || !req.product) {
      return NextResponse.json(
        { error: 'Missing or invalid field: request' },
        { status: 400 }
      );
    }

    const result = await recommendationEngine.recommend(influencers, req);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Recommend influencers error:', error);
    return NextResponse.json(
      { error: 'Failed to recommend influencers' },
      { status: 500 }
    );
  }
}
