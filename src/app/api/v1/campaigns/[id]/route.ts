// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { campaignsService } from '@/services/campaigns';

// GET /api/v1/campaigns/[id] - 获取营销活动详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await campaignsService.getById(params.id);

    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: 'Campaign not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: campaign,
    });
  } catch (error: any) {
    console.error('[Campaigns/[id]] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch campaign',
    }, { status: 500 });
  }
}

// PATCH /api/v1/campaigns/[id] - 更新营销活动
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const campaign = await campaignsService.update(params.id, body);

    return NextResponse.json({
      success: true,
      data: campaign,
    });
  } catch (error: any) {
    console.error('[Campaigns/[id]] PATCH error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update campaign',
    }, { status: 500 });
  }
}

// DELETE /api/v1/campaigns/[id] - 删除营销活动
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await campaignsService.delete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error: any) {
    console.error('[Campaigns/[id]] DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete campaign',
    }, { status: 500 });
  }
}
