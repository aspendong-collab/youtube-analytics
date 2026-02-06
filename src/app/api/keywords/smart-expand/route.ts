import { NextRequest, NextResponse } from 'next/server';
import { keywordExpansionService } from '@/lib/services/keyword-expansion';
import type { ExpansionConfig, SupportedLanguage } from '@/lib/services/keyword-expansion/types';

/**
 * POST /api/keywords/smart-expand
 * 智能拓展关键词
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, category, useRuleEngine, useLLMEngine, useDataMining, language } = body;

    // 参数验证
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json(
        { error: '关键词不能为空' },
        { status: 400 }
      );
    }

    // 构建配置
    const config: ExpansionConfig = {
      useRuleEngine: useRuleEngine !== false, // 默认启用
      useLLMEngine: useLLMEngine !== false, // 默认启用
      useDataMining: useDataMining !== false, // 默认启用
      keywordCategory: category || 'generic',
      language: language || 'zh-CN', // 默认简体中文
    };

    // 执行拓展
    const result = await keywordExpansionService.expandKeywords(
      keyword.trim(),
      config
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('关键词拓展失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '关键词拓展失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/keywords/smart-expand?limit=10
 * 获取历史拓展记录
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const history = await keywordExpansionService.getHistory(limit);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取历史记录失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
