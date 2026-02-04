import { NextRequest, NextResponse } from 'next/server';
import { influencerCollector } from '@/lib/influencer-collector';
import type { RecommendationRequest } from '@/types/influencer';

/**
 * POST /api/influencers/recommend
 * 一键推荐达人（采集 + 评分 + 推荐）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, product, targetCount, filters } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing required field: keyword' },
        { status: 400 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Missing required field: product' },
        { status: 400 }
      );
    }

    console.log(`开始一键推荐: ${keyword}`);

    // 步骤1：采集达人
    const influencers = await influencerCollector.collectByKeyword(keyword, {
      maxResults: 50,
      includeRecentVideos: true,
      recentVideosCount: 10,
    });

    if (influencers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          influencers: [],
          recommended: [],
          alternatives: [],
          summary: {
            totalFound: 0,
            recommendedCount: 0,
            avgScore: 0,
          },
        },
      });
    }

    // 步骤2：评分
    const scoringModel = await import('@/lib/influencer-collector').then(m => new m.ScoringModel());
    const scored = influencers.map(influencer => ({
      ...influencer,
      score: scoringModel.scoreInfluencer(influencer, product),
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
    const recommended = allocateBudget(tierGroups, {
      product,
      targetCount: targetCount || 10,
    });

    // 步骤6：生成替代方案
    const alternatives = sorted.filter(s => !recommended.includes(s)).slice(0, 20);

    console.log(`推荐完成: ${recommended.length} 个达人`);

    return NextResponse.json({
      success: true,
      data: {
        influencers: sorted,
        recommended,
        alternatives,
        summary: {
          totalFound: influencers.length,
          recommendedCount: recommended.length,
          avgScore: Math.round(
            recommended.reduce((sum, r) => sum + r.score.total, 0) / recommended.length
          ),
        },
      },
    });
  } catch (error) {
    console.error('Recommend influencers error:', error);
    return NextResponse.json(
      { error: 'Failed to recommend influencers', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * 预算分配
 */
function allocateBudget(tierGroups: any, request: { product: any; targetCount: number }): any[] {
  const budget = request.product.budget || 5000;
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
