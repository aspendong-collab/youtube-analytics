// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { negotiationsService } from '@/services/negotiations';

// GET /api/v1/negotiations/[id] - 获取谈判记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const negotiation = await negotiationsService.getById(params.id);

    if (!negotiation) {
      return NextResponse.json({
        success: false,
        error: 'Negotiation not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: negotiation,
    });
  } catch (error: any) {
    console.error('[Negotiations/[id]] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch negotiation',
    }, { status: 500 });
  }
}

// PATCH /api/v1/negotiations/[id] - 更新谈判记录
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const negotiation = await negotiationsService.update(params.id, body);

    return NextResponse.json({
      success: true,
      data: negotiation,
    });
  } catch (error: any) {
    console.error('[Negotiations/[id]] PATCH error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update negotiation',
    }, { status: 500 });
  }
}

// DELETE /api/v1/negotiations/[id] - 删除谈判记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await negotiationsService.delete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Negotiation deleted successfully',
    });
  } catch (error: any) {
    console.error('[Negotiations/[id]] DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete negotiation',
    }, { status: 500 });
  }
}
