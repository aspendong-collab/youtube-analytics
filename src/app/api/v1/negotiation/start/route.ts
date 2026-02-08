/**
 * 自动化砍价流程 API
 * 整合 CPV 计算、砍价逻辑、邮件发送的完整流程
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbInstance as db } from '@/lib/db';
import { aiInfluencers, campaigns, campaignAutoMatches, campaignEmailQueue } from '@/storage/database/shared/schema';
import { cpvService, InfluencerCPVData, BudgetConstraints } from '@/services/auto-campaign/cpv-calculation-service';
import { cpvNegotiationService } from '@/services/auto-campaign/cpv-negotiation-service';
import { emailTemplateService } from '@/services/email/templates';
import { logger } from '@/core/logger';
import { generateId } from '@/shared/utils/string';
import { eq, and, desc } from 'drizzle-orm';

// 强制动态路由
export const dynamic = 'force-dynamic';

/**
 * 启动自动化砍价流程请求
 */
interface StartNegotiationRequest {
  campaignId: string;
  influencerId: string;
  autoMatchId?: string;
  influencerPrice?: number;
  priority?: 'cheapest' | 'balanced' | 'quality';
  targetCPV?: number;
}

/**
 * POST /api/v1/negotiation/start - 启动自动化砍价流程
 */
export async function POST(request: NextRequest) {
  try {
    const body: StartNegotiationRequest = await request.json();

    logger.info('[Negotiation Flow] Starting automation', body);

    // 1. 验证参数
    if (!body.campaignId || !body.influencerId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: campaignId, influencerId',
      }, { status: 400 });
    }

    // 2. 获取活动信息
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, body.campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: 'Campaign not found',
      }, { status: 404 });
    }

    // 3. 获取达人信息
    const [influencer] = await db
      .select()
      .from(aiInfluencers)
      .where(eq(aiInfluencers.id, body.influencerId))
      .limit(1);

    if (!influencer) {
      return NextResponse.json({
        success: false,
        error: 'Influencer not found',
      }, { status: 404 });
    }

    // 4. 构建预算约束
    const budget: BudgetConstraints = {
      totalBudget: Number(campaign.budget || 0),
      targetCPV: body.targetCPV,
      priority: body.priority || 'cheapest',
    };

    // 5. 构建 CPV 数据
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

    // 6. 计算 CPV
    const cpvResult = cpvService.calculateCPV(influencerCPVData, budget);

    logger.info('[Negotiation Flow] CPV calculated', {
      estimatedCPV: cpvResult.estimatedCPV,
      recommendedPrice: cpvResult.recommendedPrice,
      initialOffer: cpvResult.initialOffer,
    });

    // 7. 启动谈判
    const negotiationRequest = {
      campaignId: body.campaignId,
      influencerId: body.influencerId,
      autoMatchId: body.autoMatchId,
      influencerPrice: body.influencerPrice || cpvResult.recommendedPrice * 1.5,
      totalBudget: budget.totalBudget,
      targetCPV: body.targetCPV,
      priority: budget.priority,
      maxRounds: 5,
    };

    const negotiationResult = await cpvNegotiationService.startNegotiation(negotiationRequest);

    if (!negotiationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to start negotiation',
        data: negotiationResult,
      }, { status: 500 });
    }

    // 8. 如果需要发送邮件，生成并发送邮件
    if (negotiationResult.shouldContinue && negotiationResult.nextOffer) {
      const emailResult = await sendNegotiationEmail({
        campaign,
        influencer,
        cpvResult,
        offer: negotiationResult.nextOffer,
        message: negotiationResult.message,
        round: 1,
      });

      if (!emailResult.success) {
        logger.error('[Negotiation Flow] Failed to send email', emailResult);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        cpvAnalysis: cpvResult,
        negotiation: negotiationResult,
      },
    });

  } catch (error: any) {
    logger.error('[Negotiation Flow] Failed to start', error as Error);

    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * 发送砍价邮件
 */
async function sendNegotiationEmail(data: {
  campaign: any;
  influencer: any;
  cpvResult: any;
  offer: number;
  message: string;
  round: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 生成邮件内容
    const emailContent = emailTemplateService.renderCPVNegotiation({
      influencerName: data.influencer.channelTitle,
      campaignName: data.campaign.name,
      ourOffer: data.offer,
      estimatedCPV: data.cpvResult.estimatedCPV,
      cpvScore: data.cpvResult.cpvScore,
      isGoodDeal: data.cpvResult.isGoodDeal,
      avgViews: data.influencer.avgViews,
      engagementRate: parseFloat(data.influencer.engagementRate || '0'),
      subscribers: data.influencer.subscriberCount,
      marketCPV: data.cpvResult.marketCPV,
      negotiationRound: data.round,
      senderName: 'Marketing Team',
      senderEmail: 'noreply@ailomo.cn',
    });

    // 2. 添加到邮件队列
    const emailId = generateId();

    await db.insert(campaignEmailQueue).values({
      id: emailId,
      campaignId: data.campaign.id,
      influencerId: data.influencer.id,
      emailType: 'negotiation',
      recipientEmail: 'influencer@example.com', // TODO: 从达人数据中获取真实邮箱
      recipientName: data.influencer.channelTitle,
      subject: emailContent.subject,
      content: data.message,
      htmlContent: emailContent.html,
      provider: 'resend',
      status: 'queued',
      scheduledAt: new Date(),
      trackingEnabled: true,
      retryCount: 0,
      maxRetries: 3,
    });

    logger.info('[Negotiation Flow] Email queued', {
      emailId,
      subject: emailContent.subject,
    });

    return { success: true };

  } catch (error: any) {
    logger.error('[Negotiation Flow] Failed to send email', error as Error);
    return { success: false, error: error.message };
  }
}

/**
 * GET /api/v1/negotiation/start - API 信息
 */
export async function GET() {
  return NextResponse.json({
    service: 'Automated Negotiation Flow',
    version: '1.0.0',
    features: [
      'CPV Calculation',
      'Automated Negotiation',
      'Email Sending',
      'Data-Driven Pricing',
    ],
    endpoints: {
      'POST /api/v1/negotiation/start': 'Start automated negotiation flow',
    },
  });
}
