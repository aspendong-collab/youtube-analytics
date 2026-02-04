import { NextRequest, NextResponse } from 'next/server';
import { keywordExpander } from '@/lib/keyword-expander';

/**
 * POST /api/influencers/expand
 * 拓展搜索关键词
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API /api/influencers/expand] 收到请求');

    const body = await request.json();
    const { keyword, options } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing required field: keyword' },
        { status: 400 }
      );
    }

    console.log('[API] 拓展关键词:', keyword);
    console.log('[API] 选项:', options);

    // 拓展关键词
    const result = await keywordExpander.expand(keyword, {
      useRules: options?.useRules !== false,
      useAI: options?.useAI !== false,
      maxResults: options?.maxResults || 50,
      types: options?.types,
    });

    console.log(`[API] 拓展完成，生成 ${result.total} 个关键词`);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] 拓展关键词错误:', error);

    let errorMessage = 'Failed to expand keywords';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('[API] 错误堆栈:', error.stack);

      if (errorMessage.includes('timeout')) {
        statusCode = 504;
        errorMessage = '请求超时，请稍后重试';
      } else if (errorMessage.includes('AI') || errorMessage.includes('LLM')) {
        statusCode = 503;
        errorMessage = 'AI 服务暂不可用，请稍后重试';
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

/**
 * GET /api/influencers/expand
 * 获取关键词拓展配置信息
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      expansionTypes: [
        { value: 'synonym', label: '同义词', description: '与原关键词含义相同的词' },
        { value: 'related', label: '相关词', description: '与原关键词相关的词' },
        { value: 'industry', label: '行业术语', description: '该领域的专业术语' },
        { value: 'scenario', label: '场景词', description: '特定使用场景的词' },
        { value: 'audience', label: '目标受众', description: '目标用户群体' },
        { value: 'product', label: '产品相关', description: '产品相关关键词' },
        { value: 'ai_generated', label: 'AI 生成', description: 'AI 智能生成的关键词' },
      ],
      defaultOptions: {
        useRules: true,
        useAI: true,
        maxResults: 50,
        types: ['synonym', 'related', 'industry', 'scenario', 'audience'],
      },
    },
  });
}
