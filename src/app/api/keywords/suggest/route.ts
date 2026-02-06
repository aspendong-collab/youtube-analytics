import { NextRequest, NextResponse } from 'next/server';
import { getSuggestions, getPopularKeywords } from '@/lib/services/keyword-suggestion';

/**
 * GET /api/keywords/suggest?q=keyword&language=zh-CN
 * 获取关键词推荐
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const language = searchParams.get('language') || 'zh-CN';
    const popular = searchParams.get('popular') === 'true';

    // 如果请求热门关键词
    if (popular) {
      const popularKeywords = await getPopularKeywords(language);
      return NextResponse.json({
        success: true,
        data: {
          type: 'popular',
          keywords: popularKeywords,
        },
      });
    }

    // 如果查询为空，返回热门关键词
    if (!query.trim()) {
      const popularKeywords = await getPopularKeywords(language);
      return NextResponse.json({
        success: true,
        data: {
          type: 'popular',
          keywords: popularKeywords,
        },
      });
    }

    // 获取搜索建议
    const suggestions = await getSuggestions(query, language);

    return NextResponse.json({
      success: true,
      data: {
        type: 'suggestions',
        query,
        keywords: suggestions,
      },
    });
  } catch (error) {
    console.error('获取关键词推荐失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取关键词推荐失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
