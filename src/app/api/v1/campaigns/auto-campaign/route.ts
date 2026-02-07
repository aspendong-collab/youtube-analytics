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
      maxPrice,
      startDate,
      endDate,
      criteria,
      negotiationStrategy,
      autoMatching,
      autoNegotiation,
      senderName,
      senderEmail,
      companyName,
      websiteUrl,
    } = body;

    if (!name || !budget) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, budget',
      }, { status: 400 });
    }

    if (!senderName || !senderEmail || !companyName) {
      return NextResponse.json({
        success: false,
        error: 'Missing email configuration: senderName, senderEmail, companyName',
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
      const budgetLimit = parseFloat(budget);
      const priceLimit = maxPrice ? parseFloat(maxPrice) : null;

      console.log('[AutoCampaign] Starting auto matching...', { campaignId: campaign.id, budgetLimit, priceLimit });

      // 补充缺失的必需字段
      const fullCriteria = {
        ...criteria,
        minSubscriberCount: criteria.minSubscribers || criteria.minSubscriberCount || 0,
        maxSubscriberCount: criteria.maxSubscribers || criteria.maxSubscriberCount || 1000000, // 设置更合理的上限（100万）
        minEngagementRate: criteria.minEngagementRate || 0,
      };

      matchResult = await autoMatchingService.match({
        campaignId: campaign.id,
        criteria: fullCriteria,
        budgetLimit, // 总预算限制
        priceLimit, // 单个达人最高限价
      });

      console.log('[AutoCampaign] Auto matching completed', { matchedCount: matchResult.matchedInfluencers.length });

      // 4. 批量创建邀请邮件
      const influencerIds = matchResult.matchedInfluencers.map(m => m.influencerId);
      console.log('[AutoCampaign] Creating email invitations...', { influencerIds });
      
      await emailQueueService.batchCreateInvitations(
        campaign.id,
        influencerIds,
        {
          name,
          description,
          minPrice: priceLimit ? priceLimit * 0.7 : 70,
          maxPrice: priceLimit || 100,
          senderName: senderName || 'Marketing Team',
          senderEmail: senderEmail || 'noreply@yourdomain.com',
          companyName: companyName || '',
          websiteUrl: websiteUrl || '',
        }
      );

      console.log('[AutoCampaign] Email invitations created');

      // 5. 更新活动状态为进行中
      await campaignsService.update(campaign.id, {
        status: 'active',
      });

      console.log('[AutoCampaign] Campaign status updated to active');
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
