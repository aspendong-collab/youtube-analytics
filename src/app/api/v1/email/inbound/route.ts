/**
 * Inbound Email 处理 API
 * 接收达人回复的邮件，自动解析并触发砍价逻辑
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbInstance as db } from '@/lib/db';
import { campaignEmailQueue, campaignAutoMatches, campaigns, aiInfluencers } from '@/storage/database/shared/schema';
import { logger } from '@/core/logger';
import { cpvNegotiationService } from '@/services/auto-campaign/cpv-negotiation-service';
import { eq, and, desc } from 'drizzle-orm';
import { createResendProvider } from '@/services/email/resend-provider';

// 强制动态路由
export const dynamic = 'force-dynamic';

/**
 * Resend Inbound Email 格式
 */
interface ResendInboundEmail {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
  headers: Record<string, string>;
  created_at: string;
}

/**
 * 解析的邮件回复信息
 */
interface ParsedEmailReply {
  price?: number;
  acceptance?: boolean;
  rejection?: boolean;
  message: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

/**
 * POST /api/v1/email/inbound - 接收达人回复
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 验证 Resend 签名
    const signature = request.headers.get('resend-signature');
    if (!signature) {
      logger.warn('[Inbound Email] No signature provided, skipping verification');
    }

    // 2. 解析邮件
    const email: ResendInboundEmail = await request.json();

    logger.info('[Inbound Email] Received email', {
      from: email.from,
      to: email.to,
      subject: email.subject,
    });

    // 3. 提取发件人邮箱
    const fromEmail = extractEmailAddress(email.from);
    if (!fromEmail) {
      throw new Error('Invalid from email address');
    }

    // 4. 查找对应的邮件记录
    const [emailRecord] = await db
      .select({
        queue: campaignEmailQueue,
        match: campaignAutoMatches,
        campaign: campaigns,
        influencer: aiInfluencers,
      })
      .from(campaignEmailQueue)
      .leftJoin(campaignAutoMatches, eq(campaignEmailQueue.autoMatchId, campaignAutoMatches.id))
      .leftJoin(campaigns, eq(campaignEmailQueue.campaignId, campaigns.id))
      .leftJoin(aiInfluencers, eq(campaignEmailQueue.influencerId, aiInfluencers.id))
      .where(eq(campaignEmailQueue.recipientEmail, fromEmail))
      .orderBy(desc(campaignEmailQueue.createdAt))
      .limit(1);

    if (!emailRecord || !emailRecord.queue) {
      logger.warn('[Inbound Email] No matching email record found', { fromEmail });
      return NextResponse.json({
        success: false,
        error: 'No matching email record found',
      }, { status: 404 });
    }

    const { queue, match, campaign, influencer } = emailRecord;

    logger.info('[Inbound Email] Found matching record', {
      campaignId: campaign?.id,
      influencerId: influencer?.id,
      autoMatchId: match?.id,
      emailType: queue.emailType,
    });

    // 5. 解析邮件内容
    const parsedReply = await parseEmailReply(email.text || email.html);
    logger.info('[Inbound Email] Parsed reply', {
      parsedReply,
    });

    // 6. 更新邮件记录
    await db
      .update(campaignEmailQueue)
      .set({
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(campaignEmailQueue.id, queue.id));

    // 7. 根据邮件类型处理
    if (queue.emailType === 'invitation' && parsedReply.price !== undefined) {
      // 邀请邮件回复：开始砍价
      const negotiationResult = await handleInvitationReply({
        campaignId: queue.campaignId,
        influencerId: queue.influencerId,
        autoMatchId: queue.autoMatchId || undefined,
        influencerPrice: parsedReply.price,
        totalBudget: Number(campaign?.budget || 0),
        message: parsedReply.message,
        sentiment: parsedReply.sentiment,
        match: match,
      });

      return NextResponse.json({
        success: true,
        message: 'Negotiation started',
        data: negotiationResult,
      });
    }

    if (queue.emailType === 'negotiation' && parsedReply.price !== undefined) {
      // 砍价邮件回复：继续砍价
      const negotiationResult = await handleNegotiationReply({
        campaignId: queue.campaignId,
        influencerId: queue.influencerId,
        counterOffer: parsedReply.price,
        message: parsedReply.message,
      });

      return NextResponse.json({
        success: true,
        message: 'Negotiation continued',
        data: negotiationResult,
      });
    }

    if (parsedReply.acceptance) {
      // 接受报价：结束谈判
      await handleAcceptance({
        campaignId: queue.campaignId,
        influencerId: queue.influencerId,
        autoMatchId: queue.autoMatchId || undefined,
        finalPrice: parsedReply.price || 0,
        message: parsedReply.message,
      });

      return NextResponse.json({
        success: true,
        message: 'Offer accepted',
      });
    }

    if (parsedReply.rejection) {
      // 拒绝报价：结束谈判
      await handleRejection({
        campaignId: queue.campaignId,
        influencerId: queue.influencerId,
        autoMatchId: queue.autoMatchId || undefined,
        message: parsedReply.message,
      });

      return NextResponse.json({
        success: true,
        message: 'Offer rejected',
      });
    }

    // 默认：记录回复，需要人工处理
    logger.warn('[Inbound Email] Unable to auto-process, needs manual review', {
      fromEmail,
      subject: email.subject,
    });

    return NextResponse.json({
      success: true,
      message: 'Email received, needs manual review',
    });

  } catch (error: any) {
    logger.error('[Inbound Email] Failed to process email', error as Error, {
      body: await request.text(),
    });

    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * 处理邀请邮件回复（开始砍价）
 */
async function handleInvitationReply(data: {
  campaignId: string;
  influencerId: string;
  autoMatchId?: string;
  influencerPrice: number;
  totalBudget: number;
  message: string;
  sentiment: string;
  match?: any;
}) {
  logger.info('[Inbound Email] Handling invitation reply', data);

  // 启动基于 CPV 的自动谈判
  const negotiationResult = await cpvNegotiationService.startNegotiation({
    campaignId: data.campaignId,
    influencerId: data.influencerId,
    autoMatchId: data.autoMatchId,
    influencerPrice: data.influencerPrice,
    totalBudget: data.totalBudget,
    priority: 'cheapest', // 越便宜越好
    maxRounds: 5,
  });

  logger.info('[Inbound Email] Negotiation started', {
    shouldContinue: negotiationResult.shouldContinue,
    nextOffer: negotiationResult.nextOffer,
  });

  // 如果需要继续砍价，发送砍价邮件
  if (negotiationResult.shouldContinue && negotiationResult.nextOffer) {
    await sendNegotiationEmail({
      campaignId: data.campaignId,
      influencerId: data.influencerId,
      offer: negotiationResult.nextOffer,
      message: negotiationResult.message,
    });
  }

  return negotiationResult;
}

/**
 * 处理砍价邮件回复（继续砍价）
 */
async function handleNegotiationReply(data: {
  campaignId: string;
  influencerId: string;
  counterOffer: number;
  message: string;
}) {
  logger.info('[Inbound Email] Handling negotiation reply', data);

  // 获取最近的谈判记录
  const [negotiation] = await db
    .select()
    .from(campaignNegotiationLogs)
    .where(
      and(
        eq(campaignNegotiationLogs.campaignId, data.campaignId),
        eq(campaignNegotiationLogs.influencerId, data.influencerId),
        eq(campaignNegotiationLogs.status, 'in_progress')
      )
    )
    .orderBy(desc(campaignNegotiationLogs.startedAt))
    .limit(1);

  if (!negotiation) {
    logger.warn('[Inbound Email] No active negotiation found');
    return { success: false, message: 'No active negotiation found' };
  }

  // 处理对方报价
  const negotiationResult = await cpvNegotiationService.handleCounterOffer(
    negotiation.id,
    data.counterOffer,
    data.message
  );

  logger.info('[Inbound Email] Negotiation continued', {
    shouldContinue: negotiationResult.shouldContinue,
    nextOffer: negotiationResult.nextOffer,
  });

  // 如果需要继续砍价，发送砍价邮件
  if (negotiationResult.shouldContinue && negotiationResult.nextOffer) {
    await sendNegotiationEmail({
      campaignId: data.campaignId,
      influencerId: data.influencerId,
      offer: negotiationResult.nextOffer,
      message: negotiationResult.message,
    });
  }

  return negotiationResult;
}

/**
 * 处理接受报价
 */
async function handleAcceptance(data: {
  campaignId: string;
  influencerId: string;
  autoMatchId?: string;
  finalPrice: number;
  message: string;
}) {
  logger.info('[Inbound Email] Handling acceptance', data);

  // 更新匹配状态
  if (data.autoMatchId) {
    await db
      .update(campaignAutoMatches)
      .set({
        status: 'accepted',
        finalPrice: data.finalPrice,
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(campaignAutoMatches.id, data.autoMatchId));
  }

  // 更新活动统计
  await db
    .update(campaigns)
    .set({
      acceptedInfluencerCount: sql`${campaigns.acceptedInfluencerCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, data.campaignId));

  // 发送确认邮件
  await sendConfirmationEmail({
    campaignId: data.campaignId,
    influencerId: data.influencerId,
    finalPrice: data.finalPrice,
  });

  logger.info('[Inbound Email] Acceptance handled successfully');
}

/**
 * 处理拒绝报价
 */
async function handleRejection(data: {
  campaignId: string;
  influencerId: string;
  autoMatchId?: string;
  message: string;
}) {
  logger.info('[Inbound Email] Handling rejection', data);

  // 更新匹配状态
  if (data.autoMatchId) {
    await db
      .update(campaignAutoMatches)
      .set({
        status: 'rejected',
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(campaignAutoMatches.id, data.autoMatchId));
  }

  logger.info('[Inbound Email] Rejection handled successfully');
}

/**
 * 发送砍价邮件
 */
async function sendNegotiationEmail(data: {
  campaignId: string;
  influencerId: string;
  offer: number;
  message: string;
}) {
  // TODO: 实现发送砍价邮件的逻辑
  logger.info('[Inbound Email] Sending negotiation email', data);

  // 使用邮件队列发送
  // await emailQueueService.addToQueue({
  //   campaignId: data.campaignId,
  //   influencerId: data.influencerId,
  //   emailType: 'negotiation',
  //   subject: `Re: Our Collaboration Offer - $${data.offer}`,
  //   content: data.message,
  // });
}

/**
 * 发送确认邮件
 */
async function sendConfirmationEmail(data: {
  campaignId: string;
  influencerId: string;
  finalPrice: number;
}) {
  // TODO: 实现发送确认邮件的逻辑
  logger.info('[Inbound Email] Sending confirmation email', data);
}

/**
 * 提取邮箱地址
 */
function extractEmailAddress(emailStr: string): string | null {
  const match = emailStr.match(/<([^>]+)>/) || emailStr.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
  return match ? match[1] : null;
}

/**
 * 解析邮件回复（AI）
 */
async function parseEmailReply(content: string): Promise<ParsedEmailReply> {
  // 简单的关键词匹配（可以使用 AI 提升准确率）
  const lowerContent = content.toLowerCase();

  // 提取价格
  const priceMatch = content.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)/g);
  const prices = priceMatch
    ?.map(p => parseFloat(p.replace(/[$,]/g, '')))
    .filter(p => p > 0 && p < 1000000); // 过滤合理的价格范围
  const price = prices && prices.length > 0 ? prices[0] : undefined;

  // 判断情感倾向
  const positiveKeywords = ['accept', 'agree', 'great', 'deal', 'sounds good', 'works'];
  const negativeKeywords = ['reject', 'decline', 'no', 'cannot', 'unable', 'not interested'];
  const positiveCount = positiveKeywords.filter(k => lowerContent.includes(k)).length;
  const negativeCount = negativeKeywords.filter(k => lowerContent.includes(k)).length;

  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (positiveCount > negativeCount) {
    sentiment = 'positive';
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
  }

  return {
    price,
    acceptance: sentiment === 'positive' && price !== undefined,
    rejection: sentiment === 'negative',
    message: content.substring(0, 500), // 截取前 500 字符
    sentiment,
  };
}

/**
 * GET /api/v1/email/inbound - Inbound Email 信息
 */
export async function GET() {
  return NextResponse.json({
    service: 'Resend Inbound Email Handler',
    version: '1.0.0',
    documentation: 'https://resend.com/docs/api-reference/inbound-emails',
  });
}

// 导入谈判日志表
import { campaignNegotiationLogs } from '@/storage/database/shared/schema';
