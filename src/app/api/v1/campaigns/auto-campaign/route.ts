// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { campaignsService } from '@/services/campaigns';
import { autoMatchingService } from '@/services/auto-campaign';
import { emailQueueService } from '@/services/email/queue-service';

// POST /api/v1/campaigns/auto-campaign - 创建自动化推广项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      description,
      budget,
      budgetPerInfluencer,
      targetInfluencerCount,
      startDate,
      endDate,
      criteria,
      negotiationStrategy,
      autoMatching,
      autoNegotiation,
    } = body;

    if (!name || !budget || !budgetPerInfluencer || !targetInfluencerCount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, budget, budgetPerInfluencer, targetInfluencerCount',
      }, { status: 400 });
    }

    // 1. 创建活动
    const campaign = await campaignsService.create({
      name,
      description: description || null,
      budget: parseFloat(budget),
      currency: 'USD',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: 'planned',
      category: criteria?.categories?.[0] || null,
      targetAudience: JSON.stringify(criteria),
      goals: [],
      requirements: null,
      userId: 'system', // TODO: 从 session 获取
    });

    // 2. 扩展 campaigns 表的新字段（如果字段已存在，这里会更新）
    // 注意：这里需要先执行数据库迁移添加这些字段

    // 3. 如果启用了自动匹配，立即开始匹配
    let matchResult = null;
    if (autoMatching) {
      matchResult = await autoMatchingService.match({
        campaignId: campaign.id,
        criteria: criteria,
        targetCount: targetInfluencerCount,
        budgetPerInfluencer: parseFloat(budgetPerInfluencer),
      });

      // 4. 批量创建邀请邮件
      const influencerIds = matchResult.matchedInfluencers.map(m => m.influencerId);
      await emailQueueService.batchCreateInvitations(
        campaign.id,
        influencerIds,
        {
          name,
          description,
          minPrice: budgetPerInfluencer * 0.7,
          maxPrice: budgetPerInfluencer,
          senderName: 'Marketing Team',
          senderEmail: 'noreply@yourdomain.com',
          companyName: '',
        }
      );

      // 5. 更新活动状态为进行中
      await campaignsService.update(campaign.id, {
        status: 'active',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        matchResult,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('[AutoCampaign] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create auto campaign',
    }, { status: 500 });
  }
}
