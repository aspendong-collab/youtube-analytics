// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbInstance as db } from '@/lib/db';
import { campaignAutoMatches, campaignEmailQueue, campaignNegotiationLogs } from '@/storage/database/shared/schema';
import { autoMatchingService } from '@/services/auto-campaign';
import { emailQueueService } from '@/services/email/queue-service';
import { eq, sql, desc } from 'drizzle-orm';

// GET /api/v1/campaigns/[id]/auto-progress - 查看自动化进度
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;

    // 1. 获取匹配统计
    const [matchStats] = await db
      .select({
        totalMatched: sql<number>`COUNT(*)`,
        sent: sql<number>`COUNT(CASE WHEN status = 'sent' THEN 1 END)`,
        responded: sql<number>`COUNT(CASE WHEN status = 'responded' THEN 1 END)`,
        negotiating: sql<number>`COUNT(CASE WHEN status = 'negotiating' THEN 1 END)`,
        accepted: sql<number>`COUNT(CASE WHEN status = 'accepted' THEN 1 END)`,
        rejected: sql<number>`COUNT(CASE WHEN status = 'rejected' THEN 1 END)`,
      })
      .from(campaignAutoMatches)
      .where(eq(campaignAutoMatches.campaignId, campaignId));

    // 2. 获取邮件统计
    const emailStats = await emailQueueService.getStatistics(campaignId);

    // 3. 获取谈判统计
    const [negotiationStats] = await db
      .select({
        inProgress: sql<number>`COUNT(CASE WHEN status = 'in_progress' THEN 1 END)`,
        accepted: sql<number>`COUNT(CASE WHEN status = 'accepted' THEN 1 END)`,
        rejected: sql<number>`COUNT(CASE WHEN status = 'rejected' THEN 1 END)`,
        userIntervention: sql<number>`COUNT(CASE WHEN status = 'user_intervention' THEN 1 END)`,
      })
      .from(campaignNegotiationLogs)
      .where(eq(campaignNegotiationLogs.campaignId, campaignId));

    // 4. 获取匹配的达人列表
    const matchedInfluencers = await autoMatchingService.getMatchedInfluencers(campaignId);

    // 5. 组装进度数据
    const progress = {
      totalMatched: Number(matchStats.totalMatched || 0),
      emailsQueued: Number(emailStats.queued || 0),
      emailsSent: Number(emailStats.sent || 0),
      emailsFailed: Number(emailStats.failed || 0),
      emailsOpened: Number(emailStats.opened || 0),
      negotiationsInProgress: Number(negotiationStats.inProgress || 0),
      negotiationsAccepted: Number(negotiationStats.accepted || 0),
      negotiationsRejected: Number(negotiationStats.rejected || 0),
      awaitingUserApproval: Number(negotiationStats.userIntervention || 0),
      dealsConfirmed: Number(matchStats.accepted || 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        progress,
        matchedInfluencers: matchedInfluencers.slice(0, 10), // 只返回前10个
        totalMatched: matchedInfluencers.length,
      },
    });

  } catch (error: any) {
    console.error('[AutoProgress] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch auto progress',
    }, { status: 500 });
  }
}
