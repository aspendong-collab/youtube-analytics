/**
 * 获取在线人数 API
 * GET /api/stats/online-users
 *
 * 在线人数统计逻辑：
 * - 使用内存存储在线用户集合
 * - 客户端每30-60秒发送一次心跳更新在线状态
 * - 5分钟未发送心跳的用户自动下线
 * - 返回真实的在线用户数
 */

import { NextRequest, NextResponse } from 'next/server';
import { onlineUsersManager } from '@/lib/online-users';

export async function GET(request: NextRequest) {
  try {
    // 获取在线用户数量（自动清理过期用户）
    const onlineCount = onlineUsersManager.getOnlineCount();

    return NextResponse.json({
      success: true,
      data: {
        onlineUsers: onlineCount,
        timestamp: new Date().toISOString(),
        note: '实时统计：最近5分钟内有心跳记录的在线用户'
      }
    });
  } catch (error) {
    console.error('[API] 获取在线人数失败:', error);
    // 返回默认值，避免显示 0
    return NextResponse.json({
      success: true,
      data: {
        onlineUsers: 0,
        timestamp: new Date().toISOString(),
        note: '默认值：API调用失败时的保底值'
      }
    });
  }
}
