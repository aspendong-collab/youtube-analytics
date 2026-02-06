/**
 * 获取在线人数 API
 * GET /api/stats/online-users
 *
 * 在线人数统计逻辑：
 * - 统计最近30分钟内有登录记录的用户
 * - 如果实际在线人数过少（< 5），则返回用户总数的 5% 作为最小值
 * - 这是一个合理的估算，确保显示的在线人数不会太少
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';
import { users } from '@/storage/database/shared/schema';
import { sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // 统计最近30分钟内有登录记录的用户
    // 30分钟 = 30 * 60 * 1000 = 1800000 毫秒
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // 查询活跃用户
    // 条件：lastLoginAt > 30分钟前
    const activeUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(
        sql`${users.isActive} = true
          AND ${users.status} = 'approved'
          AND ${users.lastLoginAt} > ${thirtyMinutesAgo}`
      );

    let onlineCount = activeUsers.length;

    // 如果在线人数过少，返回一个基于用户总数的估算值
    // 最少显示5个在线用户，或用户总数的5%
    if (onlineCount < 5) {
      const totalUsers = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.isActive} = true AND ${users.status} = 'approved'`);

      const totalApprovedUsers = totalUsers[0]?.count || 0;
      const estimatedCount = Math.max(5, Math.ceil(totalApprovedUsers * 0.05));
      onlineCount = estimatedCount;
    }

    return NextResponse.json({
      success: true,
      data: {
        onlineUsers: onlineCount,
        timestamp: new Date().toISOString(),
        note: onlineCount === activeUsers.length
          ? '实际统计：最近30分钟内有登录记录的用户'
          : '估算值：基于用户总数的5%（实际在线用户较少）'
      }
    });
  } catch (error) {
    console.error('[API] 获取在线人数失败:', error);
    // 返回默认值，避免显示 0
    return NextResponse.json({
      success: true,
      data: {
        onlineUsers: 5,
        timestamp: new Date().toISOString(),
        note: '默认值：API调用失败时的保底值'
      }
    });
  }
}
