import { NextRequest, NextResponse } from 'next/server';
import { workflowTrackingService } from '@/services/auto-campaign/workflow-tracking-service';

// GET /api/v1/campaigns/:id/workflow-steps - 获取活动的工作流步骤
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

    // 获取工作流步骤
    const steps = await workflowTrackingService.getWorkflowSteps(campaignId);

    // 计算总体进度
    const overallProgress = await workflowTrackingService.getOverallProgress(campaignId);

    return NextResponse.json({
      success: true,
      data: {
        steps,
        overallProgress,
      },
    });
  } catch (error: any) {
    console.error('Get workflow steps error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get workflow steps',
    }, { status: 500 });
  }
}
