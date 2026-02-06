import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * POST /api/test/llm
 * 测试 LLM 是否正常工作
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: '关键词不能为空' },
        { status: 400 }
      );
    }

    console.log('[LLM 测试] 开始测试 LLM...');
    console.log('[LLM 测试] 关键词:', keyword);

    const startTime = Date.now();

    // 提取自定义 headers
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config);

    console.log('[LLM 测试] LLM 客户端创建成功');

    // 测试调用
    const prompt = `请为关键词 "${keyword}" 生成 5 个相关关键词，用逗号分隔。`;

    const response = await client.invoke(
      [{ role: 'user', content: prompt }],
      {
        model: 'doubao-seed-1-6-flash-250615',
        temperature: 0.7,
      },
      undefined,
      customHeaders
    );

    const duration = Date.now() - startTime;

    console.log('[LLM 测试] LLM 调用成功');
    console.log('[LLM 测试] 响应内容:', response.content);
    console.log('[LLM 测试] 耗时:', duration, 'ms');

    return NextResponse.json({
      success: true,
      data: {
        response: response.content,
        duration,
      },
    });
  } catch (error) {
    console.error('[LLM 测试] 错误:', error);
    console.error('[LLM 测试] 错误详情:', error instanceof Error ? error.message : String(error));
    console.error('[LLM 测试] 错误堆栈:', error instanceof Error ? error.stack : 'No stack');

    return NextResponse.json(
      {
        success: false,
        error: 'LLM 测试失败',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
