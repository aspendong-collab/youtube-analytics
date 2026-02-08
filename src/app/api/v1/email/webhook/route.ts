/**
 * Resend Webhook 处理 API
 * 接收邮件事件：opened, clicked, delivered, bounced, complained
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbInstance as db } from '@/lib/db';
import { campaignEmailQueue } from '@/storage/database/shared/schema';
import { logger } from '@/core/logger';
import { eq, sql } from 'drizzle-orm';

// 强制动态路由
export const dynamic = 'force-dynamic';

/**
 * Resend Webhook 事件类型
 */
interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | 'email.complained';
  created_at: string;
  data: {
    id: string; // Resend message ID
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // 额外字段
    opened_at?: string;
    clicked_at?: string;
    link?: string;
    bounce_type?: 'hard' | 'soft';
    bounce_reason?: string;
  };
}

/**
 * POST /api/v1/email/webhook - 接收 Resend 事件
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 验证 Resend 签名（可选，生产环境建议启用）
    const signature = request.headers.get('resend-signature');
    if (!signature) {
      logger.warn('[Email Webhook] No signature provided, skipping verification');
    }

    // 2. 解析事件
    const event: ResendWebhookEvent = await request.json();

    logger.info('[Email Webhook] Received event', {
      type: event.type,
      messageId: event.data.id,
      to: event.data.to,
    });

    // 3. 处理不同类型的事件
    switch (event.type) {
      case 'email.sent':
        await handleEmailSent(event);
        break;

      case 'email.delivered':
        await handleEmailDelivered(event);
        break;

      case 'email.opened':
        await handleEmailOpened(event);
        break;

      case 'email.clicked':
        await handleEmailClicked(event);
        break;

      case 'email.bounced':
        await handleEmailBounced(event);
        break;

      case 'email.complained':
        await handleEmailComplained(event);
        break;

      default:
        logger.warn('[Email Webhook] Unknown event type', { type: event.type });
    }

    return NextResponse.json({ success: true, message: 'Event processed' });

  } catch (error: any) {
    logger.error('[Email Webhook] Failed to process event', error, {
      body: await request.text(),
    });

    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * 处理邮件已发送事件
 */
async function handleEmailSent(event: ResendWebhookEvent) {
  const messageId = event.data.id;

  logger.info('[Email Webhook] Email sent', { messageId });

  // 更新邮件队列状态
  await db
    .update(campaignEmailQueue)
    .set({
      status: 'sent',
      sentAt: new Date(event.created_at),
      providerMessageId: messageId,
      updatedAt: new Date(),
    })
    .where(eq(campaignEmailQueue.providerMessageId, messageId));
}

/**
 * 处理邮件已送达事件
 */
async function handleEmailDelivered(event: ResendWebhookEvent) {
  const messageId = event.data.id;

  logger.info('[Email Webhook] Email delivered', { messageId });

  // 记录送达时间（可选）
  await db
    .update(campaignEmailQueue)
    .set({
      updatedAt: new Date(),
      // 可以添加 deliveredAt 字段
    })
    .where(eq(campaignEmailQueue.providerMessageId, messageId));
}

/**
 * 处理邮件已打开事件
 */
async function handleEmailOpened(event: ResendWebhookEvent) {
  const messageId = event.data.id;
  const openedAt = event.data.opened_at || new Date().toISOString();

  logger.info('[Email Webhook] Email opened', { messageId, openedAt });

  // 更新打开记录
  await db
    .update(campaignEmailQueue)
    .set({
      openedAt: new Date(openedAt),
      openCount: sql`${campaignEmailQueue.openCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(campaignEmailQueue.providerMessageId, messageId));

  // 触发业务逻辑：邮件被查看
  await triggerEmailViewedEvent(messageId);
}

/**
 * 处理链接点击事件
 */
async function handleEmailClicked(event: ResendWebhookEvent) {
  const messageId = event.data.id;
  const clickedAt = event.data.clicked_at || new Date().toISOString();
  const link = event.data.link;

  logger.info('[Email Webhook] Link clicked', { messageId, clickedAt, link });

  // 更新点击记录
  await db
    .update(campaignEmailQueue)
    .set({
      clickedAt: new Date(clickedAt),
      clickCount: sql`${campaignEmailQueue.clickCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(campaignEmailQueue.providerMessageId, messageId));

  // 触发业务逻辑：用户点击了链接
  await triggerLinkClickedEvent(messageId, link);
}

/**
 * 处理邮件退信事件
 */
async function handleEmailBounced(event: ResendWebhookEvent) {
  const messageId = event.data.id;
  const bounceType = event.data.bounce_type || 'hard';
  const bounceReason = event.data.bounce_reason || 'Unknown reason';

  logger.warn('[Email Webhook] Email bounced', {
    messageId,
    bounceType,
    bounceReason,
  });

  // 更新退信记录
  await db
    .update(campaignEmailQueue)
    .set({
      status: bounceType === 'hard' ? 'failed' : 'sent', // 硬退信标记为失败
      bouncedAt: new Date(),
      bounceType,
      bounceReason,
      updatedAt: new Date(),
    })
    .where(eq(campaignEmailQueue.providerMessageId, messageId));

  // 触发业务逻辑：邮件退信，可能需要更新达人联系方式
  await triggerEmailBouncedEvent(messageId, bounceType);
}

/**
 * 处理垃圾邮件投诉事件
 */
async function handleEmailComplained(event: ResendWebhookEvent) {
  const messageId = event.data.id;

  logger.error('[Email Webhook] Email complained (spam)', { messageId });

  // 更新投诉记录
  await db
    .update(campaignEmailQueue)
    .set({
      spamComplainedAt: new Date(),
      status: 'failed',
      updatedAt: new Date(),
    })
    .where(eq(campaignEmailQueue.providerMessageId, messageId));

  // 触发业务逻辑：用户举报垃圾邮件
  await triggerEmailComplainedEvent(messageId);
}

/**
 * 触发邮件被查看事件
 */
async function triggerEmailViewedEvent(messageId: string) {
  try {
    // 获取邮件记录
    const [email] = await db
      .select()
      .from(campaignEmailQueue)
      .where(eq(campaignEmailQueue.providerMessageId, messageId))
      .limit(1);

    if (!email) return;

    logger.info('[Email Webhook] Triggering email viewed event', {
      campaignId: email.campaignId,
      influencerId: email.influencerId,
    });

    // TODO: 在这里添加业务逻辑
    // 例如：
    // - 更新达人活跃度
    // - 记录营销数据
    // - 触发后续流程

  } catch (error) {
    logger.error('[Email Webhook] Failed to trigger email viewed event', error as Error);
  }
}

/**
 * 触发链接点击事件
 */
async function triggerLinkClickedEvent(messageId: string, link?: string) {
  try {
    // 获取邮件记录
    const [email] = await db
      .select()
      .from(campaignEmailQueue)
      .where(eq(campaignEmailQueue.providerMessageId, messageId))
      .limit(1);

    if (!email) return;

    logger.info('[Email Webhook] Triggering link clicked event', {
      campaignId: email.campaignId,
      influencerId: email.influencerId,
      link,
    });

    // TODO: 在这里添加业务逻辑
    // 例如：
    // - 追踪转化率
    // - 记录用户行为
    // - 触发后续流程

  } catch (error) {
    logger.error('[Email Webhook] Failed to trigger link clicked event', error as Error);
  }
}

/**
 * 触发邮件退信事件
 */
async function triggerEmailBouncedEvent(messageId: string, bounceType: string) {
  try {
    // 获取邮件记录
    const [email] = await db
      .select()
      .from(campaignEmailQueue)
      .where(eq(campaignEmailQueue.providerMessageId, messageId))
      .limit(1);

    if (!email) return;

    logger.warn('[Email Webhook] Triggering email bounced event', {
      campaignId: email.campaignId,
      influencerId: email.influencerId,
      bounceType,
    });

    // TODO: 在这里添加业务逻辑
    // 例如：
    // - 标记达人联系方式无效
    // - 暂停向该达人发送邮件
    // - 通知管理员

  } catch (error) {
    logger.error('[Email Webhook] Failed to trigger email bounced event', error as Error);
  }
}

/**
 * 触发垃圾邮件投诉事件
 */
async function triggerEmailComplainedEvent(messageId: string) {
  try {
    // 获取邮件记录
    const [email] = await db
      .select()
      .from(campaignEmailQueue)
      .where(eq(campaignEmailQueue.providerMessageId, messageId))
      .limit(1);

    if (!email) return;

    logger.error('[Email Webhook] Triggering email complained event', {
      campaignId: email.campaignId,
      influencerId: email.influencerId,
    });

    // TODO: 在这里添加业务逻辑
    // 例如：
    // - 暂停向该达人发送邮件
    // - 审查邮件内容
    // - 通知管理员

  } catch (error) {
    logger.error('[Email Webhook] Failed to trigger email complained event', error as Error);
  }
}

/**
 * GET /api/v1/email/webhook - Webhook 信息
 */
export async function GET() {
  return NextResponse.json({
    service: 'Resend Webhook Handler',
    version: '1.0.0',
    supportedEvents: [
      'email.sent',
      'email.delivered',
      'email.opened',
      'email.clicked',
      'email.bounced',
      'email.complained',
    ],
    documentation: 'https://resend.com/docs/api-reference/webhooks',
  });
}
