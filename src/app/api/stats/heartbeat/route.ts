/**
 * 心跳 API 路由
 * POST /api/stats/heartbeat
 *
 * 客户端定期发送心跳以保持在线状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { onlineUsersManager } from '@/lib/online-users';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userAgent = request.headers.get('user-agent') || undefined;

    // 更新用户在线状态
    onlineUsersManager.updateHeartbeat(userId, userAgent);

    return NextResponse.json({
      success: true,
      data: {
        userId,
        timestamp: new Date().toISOString(),
        onlineCount: onlineUsersManager.getOnlineCount(),
      }
    });
  } catch (error) {
    console.error('[API] 心跳更新失败:', error);
    return NextResponse.json(
      { error: 'Failed to update heartbeat' },
      { status: 500 }
    );
  }
}
