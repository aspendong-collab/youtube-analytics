// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { communicationsService } from '@/services/communications';

// GET /api/v1/communications/[id] - 获取沟通记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communication = await communicationsService.getById(params.id);

    if (!communication) {
      return NextResponse.json({
        success: false,
        error: 'Communication not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: communication,
    });
  } catch (error: any) {
    console.error('[Communications/[id]] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch communication',
    }, { status: 500 });
  }
}

// PATCH /api/v1/communications/[id] - 更新沟通记录
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const communication = await communicationsService.update(params.id, body);

    return NextResponse.json({
      success: true,
      data: communication,
    });
  } catch (error: any) {
    console.error('[Communications/[id]] PATCH error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update communication',
    }, { status: 500 });
  }
}

// DELETE /api/v1/communications/[id] - 删除沟通记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await communicationsService.delete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Communication deleted successfully',
    });
  } catch (error: any) {
    console.error('[Communications/[id]] DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete communication',
    }, { status: 500 });
  }
}
