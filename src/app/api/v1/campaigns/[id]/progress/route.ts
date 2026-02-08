import { NextRequest, NextResponse } from 'next/server';
import { dbInstance as db } from '@/lib/db';
import { campaignEmailQueue } from '@/storage/database/shared/schema';
import { campaigns } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

// GET /api/v1/campaigns/:id/progress - 获取活动进度和邮件数据
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;

    if (!campaignId) {
      return NextResponse.json({
        success: false,
        error: 'Campaign ID is required',
      }, { status: 400 });
    }

    // 获取活动信息
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: 'Campaign not found',
      }, { status: 404 });
    }

    // 获取邮件列表
    const emails = await db
      .select()
      .from(campaignEmailQueue)
      .where(eq(campaignEmailQueue.campaignId, campaignId))
      .orderBy(campaignEmailQueue.createdAt);

    // 计算统计数据
    const stats = {
      total: emails.length,
      sent: emails.filter(e => e.status === 'sent').length,
      delivered: emails.filter(e => e.status === 'delivered').length,
      opened: emails.filter(e => e.status === 'opened').length,
      failed: emails.filter(e => e.status === 'failed').length,
      bounced: emails.filter(e => e.status === 'bounced').length,
      queued: emails.filter(e => e.status === 'queued').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        emails,
        stats,
        progress: stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0,
      },
    });
  } catch (error: any) {
    console.error('[CampaignProgress] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get campaign progress',
    }, { status: 500 });
  }
}
