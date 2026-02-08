// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbInstance } from '@/lib/db';
import { campaignEmailQueue, campaignNegotiationLogs } from '@/storage/database/shared/campaigns-schema';
import { influencers } from '@/storage/database/shared/schema';
import { eq, desc, and, count } from 'drizzle-orm';

/**
 * GET /api/v1/campaigns/[id]/progress
 * 获取指定活动的实时进度
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    if (!campaignId) {
      return NextResponse.json({
        success: false,
        error: 'Campaign ID is required'
      }, { status: 400 });
    }

    // 查询邮件队列状态统计
    const statusStats = await dbInstance
      .select({
        status: campaignEmailQueue.status,
        count: count(),
      })
      .from(campaignEmailQueue)
      .where(eq(campaignEmailQueue.campaignId, campaignId))
      .groupBy(campaignEmailQueue.status);

    // 构建状态统计映射
    const stats = {
      total: 0,
      queued: 0,
      sending: 0,
      sent: 0,
      failed: 0,
      bounced: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
    };

    statusStats.forEach((stat) => {
      stats.total += Number(stat.count);
      if (stat.status in stats) {
        stats[stat.status as keyof typeof stats] += Number(stat.count);
      }
    });

    // 查询邮件列表（包含达人信息和谈判记录）
    const emails = await dbInstance
      .select({
        // 邮件信息
        emailId: campaignEmailQueue.id,
        emailStatus: campaignEmailQueue.status,
        emailType: campaignEmailQueue.emailType,
        subject: campaignEmailQueue.subject,
        content: campaignEmailQueue.content,
        createdAt: campaignEmailQueue.createdAt,
        sentAt: campaignEmailQueue.sentAt,
        failedAt: campaignEmailQueue.failedAt,
        errorMessage: campaignEmailQueue.errorMessage,
        retryCount: campaignEmailQueue.retryCount,
        openCount: campaignEmailQueue.openCount,
        clickCount: campaignEmailQueue.clickCount,
        bouncedAt: campaignEmailQueue.bouncedAt,
        bounceReason: campaignEmailQueue.bounceReason,

        // 达人信息
        influencerId: campaignEmailQueue.influencerId,
        channelId: influencers.channelId,
        channelTitle: influencers.channelTitle,
        thumbnail: influencers.thumbnail,
        subscriberCount: influencers.subscriberCount,
        email: influencers.email,
        level: influencers.level,
        niche: influencers.niche,

        // 谈判信息
        negotiationId: campaignNegotiationLogs.id,
        negotiationStatus: campaignNegotiationLogs.status,
        initialPrice: campaignNegotiationLogs.initialPrice,
        ourOffer: campaignNegotiationLogs.ourOffer,
        counterOffer: campaignNegotiationLogs.counterOffer,
        finalPrice: campaignNegotiationLogs.finalPrice,
        messages: campaignNegotiationLogs.messages,
        needsUserApproval: campaignNegotiationLogs.needsUserApproval,
      })
      .from(campaignEmailQueue)
      .leftJoin(
        influencers,
        eq(campaignEmailQueue.influencerId, influencers.id)
      )
      .leftJoin(
        campaignNegotiationLogs,
        and(
          eq(campaignEmailQueue.campaignId, campaignNegotiationLogs.campaignId),
          eq(campaignEmailQueue.influencerId, campaignNegotiationLogs.influencerId)
        )
      )
      .where(eq(campaignEmailQueue.campaignId, campaignId))
      .orderBy(desc(campaignEmailQueue.createdAt));

    // 解析谈判消息（JSON 字符串转对象）
    const emailsWithDetails = emails.map((email) => ({
      ...email,
      messages: email.messages ? JSON.parse(email.messages as string) : [],
      // 确保 influencer 字段有默认值
      channelId: email.channelId || '',
      channelTitle: email.channelTitle || '未知达人',
      thumbnail: email.thumbnail || '',
      subscriberCount: email.subscriberCount || 0,
      email: email.email || '',
      level: email.level || 'C',
      niche: email.niche || '',
    }));

    // 计算进度百分比
    const progress = stats.total > 0
      ? Math.round((stats.sent + stats.failed + stats.bounced) / stats.total * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        progress,
        stats,
        emails: emailsWithDetails,
      },
    });
  } catch (error: any) {
    console.error('Error fetching campaign progress:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
