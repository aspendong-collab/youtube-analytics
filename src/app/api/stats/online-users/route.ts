/**
 * 获取在线人数 API
 * GET /api/stats/online-users
 */

import { NextRequest, NextResponse } from 'next/server';

// 模拟在线人数（实际应该使用 WebSocket 或 Redis）
let onlineUsers = Math.floor(Math.random() * 50) + 10;

export async function GET(request: NextRequest) {
  try {
    // 在实际应用中，这里应该从数据库或 Redis 获取真实的在线人数
    // 目前使用模拟数据
    onlineUsers = Math.floor(Math.random() * 50) + 10;

    return NextResponse.json({
      success: true,
      data: {
        onlineUsers,
        timestamp: new Date().toISOString()
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
