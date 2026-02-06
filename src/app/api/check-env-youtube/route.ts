/**
 * 环境变量检查 API
 * GET /api/check-env - 检查环境变量配置
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 检查 YouTube API Key 相关的环境变量
    const youtubeKeys: any[] = [];

    // 检查 YOUTUBE_API_KEY_N 格式
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`YOUTUBE_API_KEY_${i}`];
      if (key && key.trim().length > 0) {
        youtubeKeys.push({
          name: `YOUTUBE_API_KEY_${i}`,
          prefix: key.substring(0, 10),
          suffix: key.substring(key.length - 5),
          length: key.length,
          isConfigured: true
        });
      } else {
        youtubeKeys.push({
          name: `YOUTUBE_API_KEY_${i}`,
          isConfigured: false
        });
      }
    }

    // 检查其他格式
    const youtubeApiKeySingle = process.env.YOUTUBE_API_KEY;
    const youtubeApiKeysJson = process.env.YOUTUBE_API_KEYS;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.env.VERCEL ? 'Vercel' : 'Local',
      },
      youtubeApiKeys: {
        format: 'YOUTUBE_API_KEY_N',
        totalConfigured: youtubeKeys.filter(k => k.isConfigured).length,
        keys: youtubeKeys
      },
      otherFormats: {
        YOUTUBE_API_KEY: youtubeApiKeySingle ? {
          isConfigured: true,
          prefix: youtubeApiKeySingle.substring(0, 10),
          suffix: youtubeApiKeySingle.substring(youtubeApiKeySingle.length - 5),
          length: youtubeApiKeySingle.length
        } : { isConfigured: false },
        YOUTUBE_API_KEYS: youtubeApiKeysJson ? {
          isConfigured: true,
          prefix: youtubeApiKeysJson.substring(0, 50),
          length: youtubeApiKeysJson.length
        } : { isConfigured: false }
      }
    });

  } catch (error) {
    console.error('[API] 检查环境变量失败:', error);
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
