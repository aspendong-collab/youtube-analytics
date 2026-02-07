// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { influencersService } from '@/services/influencers';

// GET /api/v1/influencers/[id] - 获取达人详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const influencer = await influencersService.getById(params.id);

    if (!influencer) {
      return NextResponse.json({
        success: false,
        error: 'Influencer not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: influencer,
    });
  } catch (error: any) {
    console.error('[Influencers/[id]] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch influencer',
    }, { status: 500 });
  }
}

// PATCH /api/v1/influencers/[id] - 更新达人信息
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const influencer = await influencersService.update(params.id, body);

    return NextResponse.json({
      success: true,
      data: influencer,
    });
  } catch (error: any) {
    console.error('[Influencers/[id]] PATCH error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update influencer',
    }, { status: 500 });
  }
}

// DELETE /api/v1/influencers/[id] - 删除达人
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await influencersService.delete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Influencer deleted successfully',
    });
  } catch (error: any) {
    console.error('[Influencers/[id]] DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete influencer',
    }, { status: 500 });
  }
}
