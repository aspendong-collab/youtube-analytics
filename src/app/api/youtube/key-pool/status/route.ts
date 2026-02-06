/**
 * YouTube API Key 池状态监控
 * GET /api/youtube/key-pool/status - 查看 Key 池状态
 * POST /api/youtube/key-pool/reset - 重置所有 Key 配额（管理员功能）
 */

import { NextRequest, NextResponse } from 'next/server';
import { youtubeApiKeyPool } from '@/lib/services/youtube-api-key-pool';

// GET - 查看 Key 池状态
export async function GET(request: NextRequest) {
  try {
    const status = youtubeApiKeyPool.getPoolStatus();

    return NextResponse.json({
      success: true,
      data: {
        keys: status,
        totalKeys: status.length,
        availableKeys: youtubeApiKeyPool.getAvailableKeyCount(),
        hasAvailableKey: youtubeApiKeyPool.hasAvailableKey(),
        totalQuota: status.length * 10000,
        totalUsed: status.reduce((sum, k) => sum + k.quotaUsed, 0),
        totalAvailable: status.reduce((sum, k) => sum + (k.quotaLimit - k.quotaUsed), 0),
      }
    });
  } catch (error) {
    console.error('[API] 获取 Key 池状态失败:', error);
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

// POST - 重置所有 Key 配额（仅管理员）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'reset') {
      youtubeApiKeyPool.resetAllQuotas();

      return NextResponse.json({
        success: true,
        message: '所有 API Key 配额已重置',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
        code: 'INVALID_ACTION'
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] 重置 Key 池失败:', error);
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
