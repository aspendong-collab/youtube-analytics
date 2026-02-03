import { NextResponse } from 'next/server';
import { dbInstance as db } from '@/lib/db';
import { users } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

// 设置为动态路由
export const dynamic = 'force-dynamic';

/**
 * GET /api/users
 * 获取所有用户列表
 */
export async function GET() {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error('[API /api/users] 获取用户列表失败:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * 删除用户
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // 检查用户是否存在
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser || existingUser.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 检查是否是管理员
    if (existingUser[0].role === 'admin') {
      return NextResponse.json(
        { error: '不能删除管理员账号' },
        { status: 400 }
      );
    }

    // 硬删除用户（从数据库中完全删除）
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: '用户删除成功',
    });
  } catch (error) {
    console.error('[API /api/users] 删除用户失败:', error);
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    );
  }
}
