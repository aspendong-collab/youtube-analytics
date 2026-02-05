import { NextRequest, NextResponse } from 'next/server';
import { comprehensiveKeywordCollector } from '@/lib/keyword-extractor/comprehensive-collector';

/**
 * POST /api/discovery/keywords/comprehensive
 * 综合关键词拓展（增强版）
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API /api/discovery/keywords/comprehensive] 收到请求');

    const body = await request.json();
    const {
      keyword,
      languages = ['en', 'es', 'pt'],
      options = {}
    } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing required field: keyword' },
        { status: 400 }
      );
    }

    console.log('[API] 请求参数:', { keyword, languages, options });

    // 执行综合采集
    const startTime = Date.now();
    const result = await comprehensiveKeywordCollector.collectKeywords(keyword, {
      languages,
      maxVideos: options.maxVideos || 200,
      enableSuggestions: options.enableSuggestions !== false,
      enableRelated: options.enableRelated !== false,
      enableCompetitor: options.enableCompetitor !== false,
      enableQuestions: options.enableQuestions !== false,
    });
    const duration = Date.now() - startTime;

    console.log(`[API] 采集完成，耗时: ${duration}ms`);
    console.log(`[API] 发现 ${result.totalKeywords} 个关键词`);

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        duration,
        keyword,
        languages: languages.length,
      },
    });
  } catch (error) {
    console.error('[API] 综合关键词采集错误:', error);

    let errorMessage = 'Failed to collect keywords';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (errorMessage.includes('Quota exceeded')) {
        statusCode = 429;
        errorMessage = 'API配额已用完，请明天再试';
      } else if (errorMessage.includes('API key')) {
        statusCode = 500;
        errorMessage = 'YouTube API密钥无效或已过期';
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode,
      },
      { status: statusCode }
    );
  }
}
