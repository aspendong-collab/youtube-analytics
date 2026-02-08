import { NextRequest, NextResponse } from 'next/server';
import { workflowLoggingService } from '@/services/auto-campaign/workflow-logging-service';

// GET /api/v1/campaigns/:id/workflow-logs - 获取活动的工作流日志
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const { searchParams } = new URL(request.url);

    if (!campaignId) {
      return NextResponse.json({
        success: false,
        error: 'Campaign ID is required',
      }, { status: 400 });
    }

    // 解析查询参数
    const limit = parseInt(searchParams.get('limit') || '100');
    const level = searchParams.get('level') as any;
    const stepId = searchParams.get('stepId') || undefined;
    const offset = parseInt(searchParams.get('offset') || '0');

    // 获取日志
    const logs = await workflowLoggingService.getLogs(campaignId, {
      limit,
      level,
      stepId,
      offset,
    });

    // 获取日志统计
    const stats = await workflowLoggingService.getLogStats(campaignId);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        stats,
      },
    });
  } catch (error: any) {
    console.error('Get workflow logs error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get workflow logs',
    }, { status: 500 });
  }
}
