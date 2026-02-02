import { NextRequest, NextResponse } from 'next/server';
import { ownerManager } from '@/storage/database';

// 设置为动态路由，避免构建时预加载
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/owners/:id
 * 删除负责人
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API /api/owners/:id] 收到删除负责人请求');
  try {
    const { id } = await params;

    console.log('[API /api/owners/:id] 删除负责人:', id);

    const success = await ownerManager.deleteOwner(id);

    if (!success) {
      return NextResponse.json(
        { error: '负责人不存在或删除失败' },
        { status: 404 }
      );
    }

    console.log('[API /api/owners/:id] 负责人删除成功');

    return NextResponse.json({
      success: true,
      message: '负责人删除成功',
    });
  } catch (error) {
    console.error('[API /api/owners/:id] 删除负责人失败:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
