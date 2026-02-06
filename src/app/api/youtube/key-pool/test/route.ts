/**
 * YouTube API Key 池测试 API
 * GET /api/youtube/key-pool/test - 运行 Key 池测试
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  testKeyPoolInitialization,
  testGetNextKey,
  testCreateYoutubeClient,
  testYoutubeApiCall
} from '@/lib/services/test-key-pool';

export async function GET(request: NextRequest) {
  try {
    const tests: any = {};

    // 测试 1: Key 池初始化
    const initResult = await testKeyPoolInitialization();
    tests.initialization = {
      success: true,
      data: initResult
    };

    // 测试 2: 获取下一个 Key
    const nextKey = await testGetNextKey();
    tests.getNextKey = {
      success: !!nextKey,
      data: nextKey ? nextKey.substring(0, 20) + '...' : null
    };

    // 测试 3: 创建 YouTube 客户端
    const client = await testCreateYoutubeClient();
    tests.createClient = {
      success: !!client,
      data: client ? 'created' : null
    };

    // 测试 4: YouTube API 调用
    const apiResult = await testYoutubeApiCall();
    tests.apiCall = {
      success: !!apiResult,
      data: apiResult ? 'success' : null
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests
    });
  } catch (error) {
    console.error('[API] Key 池测试失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'TEST_FAILED'
      },
      { status: 500 }
    );
  }
}
