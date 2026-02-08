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
    const campaignId = body.campaignId; // 可选的活动ID

    logger.info('Processing email queue', { limit, campaignId });

    const result = await emailQueueService.processQueue(limit);

    // 如果指定了活动ID，更新工作流进度
    if (campaignId && result.processed > 0) {
      const { workflowTrackingService } = await import('@/services/auto-campaign/workflow-tracking-service');
      const { workflowLoggingService } = await import('@/services/auto-campaign/workflow-logging-service');

      try {
        // 获取当前步骤
        const currentStep = await workflowTrackingService.getCurrentStep(campaignId);

        if (currentStep && currentStep.stepId === 'send_emails') {
          // 获取总邮件数
          const stats = await emailQueueService.getStatistics(campaignId);
          const totalEmails = stats.total;
          const sentEmails = stats.sent + stats.delivered;
          const progress = totalEmails > 0 ? Math.round((sentEmails / totalEmails) * 100) : 0;

          // 更新工作流进度
          await workflowTrackingService.updateStepProgress({
            campaignId,
            stepId: 'send_emails',
            totalTasks: totalEmails,
            completedTasks: sentEmails,
            failedTasks: stats.failed,
            progress,
          });

          await workflowLoggingService.info(campaignId, 'send_emails', 
            `邮件发送进度：${sentEmails}/${totalEmails} (${progress}%)`
          );

          // 如果所有邮件都已发送完成，标记步骤为完成
          if (sentEmails === totalEmails && totalEmails > 0) {
            await workflowTrackingService.updateStepStatus(campaignId, 'send_emails', 'completed');
            await workflowLoggingService.info(campaignId, 'send_emails', '所有邮件发送完成');

            // 启动跟踪反馈步骤
            await workflowTrackingService.updateStepStatus(campaignId, 'track_responses', 'in_progress');
            await workflowLoggingService.info(campaignId, 'track_responses', '开始跟踪邮件反馈（持续24小时）');
          }
        }
      } catch (error) {
        logger.error('Failed to update workflow progress', error as Error, { campaignId });
      }
    }

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
