/**
 * 获取在线人数 API
 * GET /api/stats/online-users
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';
import { users } from '@/storage/database/shared/schema';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // 统计最近5分钟内有活动的用户
    // 5分钟 = 5 * 60 * 1000 = 300000 毫秒
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // 查询活跃用户（基于 updatedAt 或 lastLoginAt）
    // 条件：
    // 1. isActive = true
    // 2. status = 'approved'
    // 3. (updatedAt > 5分钟前 OR lastLoginAt > 5分钟前)
    const onlineUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(
        sql`${users.isActive} = true
          AND ${users.status} = 'approved'
          AND (${users.updatedAt} > ${fiveMinutesAgo} OR ${users.lastLoginAt} > ${fiveMinutesAgo})`
      );

    const count = onlineUsers.length;

    return NextResponse.json({
      success: true,
      data: {
        onlineUsers: count,
        timestamp: new Date().toISOString(),
        note: '统计最近5分钟内有活动的已激活且已审核用户'
      }
    });
  } catch (error) {
    console.error('[API] 获取在线人数失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
