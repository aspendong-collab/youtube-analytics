import { NextRequest, NextResponse } from 'next/server';
import { ownerManager } from '@/storage/database';
import type { InsertOwner } from '@/storage/database';

// 设置为动态路由，避免构建时预加载
export const dynamic = 'force-dynamic';

/**
 * POST /api/owners
 * 创建新负责人
 */
export async function POST(request: NextRequest) {
  console.log('[API /api/owners] 收到创建负责人请求');
  try {
    const body = await request.json();
    const { name, email } = body;

    console.log('[API /api/owners] 请求参数:', { name, email });

    if (!name) {
      return NextResponse.json(
        { error: '姓名不能为空' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingOwner = await ownerManager.getOwnerByEmail(email);
      if (existingOwner) {
        return NextResponse.json(
          { error: '该邮箱已被使用' },
          { status: 409 }
        );
      }
    }

    // 创建负责人
    const insertData: InsertOwner = {
      name,
      email: email || null,
      isActive: true,
    };

    console.log('[API /api/owners] 调用 ownerManager.createOwner');
    const owner = await ownerManager.createOwner(insertData);
    console.log('[API /api/owners] 负责人创建成功:', owner.id);

    return NextResponse.json({
      success: true,
      owner,
      message: '负责人添加成功',
    });
  } catch (error) {
    console.error('[API /api/owners] 创建负责人失败:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/owners
 * 获取负责人列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const isActive = searchParams.get('isActive') === 'true' ? true :
                     searchParams.get('isActive') === 'false' ? false :
                     undefined;

    // 获取负责人列表
    const owners = await ownerManager.getOwners({
      limit,
      skip,
      isActive,
    });

    // 获取每个负责人的视频数量
    const ownersWithVideoCount = await Promise.all(
      owners.map(async (owner) => {
        const videoCount = await ownerManager.getOwnerVideoCount(owner.id);
        return {
          ...owner,
          videos: videoCount,
          status: owner.isActive ? 'active' : 'inactive',
        };
      })
    );

    return NextResponse.json({
      owners: ownersWithVideoCount,
      total: ownersWithVideoCount.length,
    });
  } catch (error) {
    console.error('[API /api/owners] 获取负责人列表失败:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
