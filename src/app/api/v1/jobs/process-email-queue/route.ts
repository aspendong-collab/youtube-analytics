// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { emailQueueService } from '@/services/email/queue-service';
import { logger } from '@/core/logger';

// POST /api/v1/jobs/process-email-queue - 处理邮件队列（手动或定时任务）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const limit = body.limit || 10;

    logger.info('Processing email queue', { limit });

    const result = await emailQueueService.processQueue(limit);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('[ProcessEmailQueue] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process email queue',
    }, { status: 500 });
  }
}

// GET /api/v1/jobs/process-email-queue - 获取队列统计
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({
        success: false,
        error: 'campaignId is required',
      }, { status: 400 });
    }

    const stats = await emailQueueService.getStatistics(campaignId);

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error: any) {
    console.error('[ProcessEmailQueue] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get email statistics',
    }, { status: 500 });
  }
}
